import {useState, useEffect} from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Typography, Divider, Autocomplete,
    CircularProgress, Checkbox, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material'
import {createFilterOptions} from '@mui/material'
import {CheckBox as CheckBoxIcon, CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon} from '@mui/icons-material'
import {useAuthenticationStore} from '@/app/store/authenticationStore'
import {getMyGroups, getGroupMembers} from '@/app/api/groups'
import {getCategories, createCategory, type Category} from '@/app/api/categories'
import {getBrands, createBrand, type Brand} from '@/app/api/brands'
import {getFlavors, createFlavor, type Flavor} from '@/app/api/flavors'
import {createProductBulk, updateProduct, rateProduct, commentProduct, type ProductRow} from '@/app/api/products'
import type {Group, GroupMember} from '@/entities/group'
import {RatingPicker} from '@/shared/ui/RatingPicker'
import styles from './ProductDialog.module.scss'

type CreatableCategory = Category & {inputValue?: string}
type CreatableBrand = Brand & {inputValue?: string}
type CreatableFlavor = Flavor & {inputValue?: string}

const categoryFilter = createFilterOptions<CreatableCategory>()
const brandFilter = createFilterOptions<CreatableBrand>()
const flavorFilter = createFilterOptions<CreatableFlavor>()

type Props =
    | {
        mode: 'create'
        open: boolean
        onClose: () => void
        onSaved: () => void
      }
    | {
        mode: 'edit'
        open: boolean
        product: ProductRow
        memberNames: Record<number, string>
        canEditOthers: boolean
        onClose: () => void
        onSaved: () => void
      }

interface OtherUser {
    userId: number
    name: string
    savedRating?: number
    savedComment?: string
}

export function ProductDialog(props: Props) {
    const {open, onClose, onSaved} = props
    const currentUser = useAuthenticationStore(state => state.user)

    const [groups, setGroups] = useState<Group[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('')

    const [categories, setCategories] = useState<Category[]>([])
    const [brands, setBrands] = useState<Brand[]>([])
    const [flavors, setFlavors] = useState<Flavor[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const [category, setCategory] = useState<Category | null>(null)
    const [brand, setBrand] = useState<Brand | null>(null)
    const [variant, setVariant] = useState('')
    const [selectedFlavors, setSelectedFlavors] = useState<Flavor[]>([])
    const [myRating, setMyRating] = useState<number | null>(null)
    const [myComment, setMyComment] = useState('')
    const [otherUsers, setOtherUsers] = useState<OtherUser[]>([])
    const [othersRatings, setOthersRatings] = useState<Record<number, number | null>>({})
    const [othersComments, setOthersComments] = useState<Record<number, string>>({})

    const productId = props.mode === 'edit' ? props.product.id : null

    useEffect(() => {
        if (!open) return
        setLoading(true)

        if (props.mode === 'create') {
            Promise.all([getMyGroups(), getCategories(), getBrands(), getFlavors()]).then(
                ([grps, cats, brs, fls]) => {
                    setGroups(grps)
                    setCategories(cats)
                    setBrands(brs)
                    setFlavors(fls)
                    setSelectedGroupId(grps[0]?.id ?? '')
                    setLoading(false)
                }
            )
        } else {
            const product = props.product
            Promise.all([getCategories(), getBrands(), getFlavors()]).then(([cats, brs, fls]) => {
                setCategories(cats)
                setBrands(brs)
                setFlavors(fls)
                setCategory(cats.find(c => c.id === product.category_id) ?? null)
                setBrand(brs.find(b => b.id === product.brand_id) ?? null)
                setSelectedFlavors(fls.filter(f => product.flavor_ids.includes(f.id)))
                setLoading(false)
            })
            setVariant(product.variant)
            const myR = product.ratings.find(r => r.user_id === currentUser?.id)
            const myC = product.comments.find(c => c.user_id === currentUser?.id)
            setMyRating(myR?.value ?? null)
            setMyComment(myC?.text ?? '')

            const otherIds = [
                ...new Set([
                    ...product.ratings.map(r => r.user_id),
                    ...product.comments.map(c => c.user_id),
                ]),
            ].filter(id => id !== currentUser?.id)

            const initRatings: Record<number, number | null> = {}
            const initComments: Record<number, string> = {}
            for (const r of product.ratings) {
                if (r.user_id !== currentUser?.id) initRatings[r.user_id] = r.value
            }
            for (const c of product.comments) {
                if (c.user_id !== currentUser?.id) initComments[c.user_id] = c.text
            }
            setOthersRatings(initRatings)
            setOthersComments(initComments)
            setOtherUsers(otherIds.map(uid => ({
                userId: uid,
                name: props.memberNames[uid] ?? `User ${uid}`,
                savedRating: product.ratings.find(r => r.user_id === uid)?.value,
                savedComment: product.comments.find(c => c.user_id === uid)?.text,
            })))
        }
    }, [open, productId])

    useEffect(() => {
        if (props.mode !== 'create') return
        if (!selectedGroupId || !currentUser) {
            setOtherUsers([])
            setOthersRatings({})
            setOthersComments({})
            return
        }
        getGroupMembers(selectedGroupId as number).then(members => {
            const others = members.filter(m => m.user_id !== currentUser.id)
            setOtherUsers(others.map(m => ({
                userId: m.user_id,
                name: `${m.first_name} ${m.last_name}`.trim() || m.username,
            })))
            setOthersRatings({})
            setOthersComments({})
        })
    }, [selectedGroupId, currentUser?.id])

    const handleClose = () => {
        if (props.mode === 'create') {
            setCategory(null)
            setBrand(null)
            setVariant('')
            setSelectedFlavors([])
            setMyRating(null)
            setMyComment('')
            setOthersRatings({})
            setOthersComments({})
        }
        onClose()
    }

    const handleSave = async () => {
        if (props.mode === 'create' && !category) return
        setSaving(true)
        try {
            if (props.mode === 'create') {
                await createProductBulk({
                    category: category!.id,
                    brand: brand?.id ?? null,
                    variant,
                    flavors: selectedFlavors.map(f => f.id),
                    groups: selectedGroupId ? [selectedGroupId as number] : [],
                    entries: [
                        {user_id: currentUser!.id, rating: myRating, comment: myComment},
                        ...otherUsers.map(u => ({
                            user_id: u.userId,
                            rating: othersRatings[u.userId] ?? null,
                            comment: othersComments[u.userId] ?? '',
                        })),
                    ],
                })
                window.dispatchEvent(new CustomEvent('productCreated'))
            } else {
                const product = props.product
                await updateProduct(product.id, {
                    category: category?.id ?? product.category_id,
                    brand: brand !== undefined ? (brand?.id ?? null) : product.brand_id,
                    variant,
                    flavors: selectedFlavors.map(f => f.id),
                })
                await rateProduct(product.id, myRating)
                await commentProduct(product.id, myComment)
                if (props.canEditOthers) {
                    await Promise.all(otherUsers.flatMap(u => [
                        rateProduct(product.id, othersRatings[u.userId] ?? null, u.userId),
                        commentProduct(product.id, othersComments[u.userId] ?? '', u.userId),
                    ]))
                }
            }
            onSaved()
            handleClose()
        } finally {
            setSaving(false)
        }
    }

    const title = props.mode === 'create'
        ? 'New product'
        : [props.product.brand, props.product.variant].filter(Boolean).join(' ') || props.product.category

    const canEditOthers = props.mode === 'create' || props.canEditOthers

    return (
        <Dialog
            open={open}
            fullScreen
            onClose={handleClose}
        >
            <DialogTitle className={styles.title}>
                <div>
                    <Typography variant='h6'>
                        {title}
                    </Typography>
                    {props.mode === 'edit' && (
                        <Typography
                            variant='body2'
                            color='text.secondary'
                        >
                            {props.product.category}
                        </Typography>
                    )}
                </div>
                <Button onClick={handleClose}>
                    Close
                </Button>
            </DialogTitle>
            <Divider/>

            {loading ? (
                <DialogContent className={styles.loadingContent}>
                    <CircularProgress/>
                </DialogContent>
            ) : (
                <DialogContent className={styles.content}>
                    {props.mode === 'create' && (
                        <section className={styles.section}>
                            <Typography
                                variant='overline'
                                className={styles.sectionTitle}
                            >
                                Group
                            </Typography>
                            <FormControl
                                size='small'
                                fullWidth
                            >
                                <InputLabel>Group</InputLabel>
                                <Select
                                    label='Group'
                                    value={selectedGroupId}
                                    onChange={e => setSelectedGroupId(e.target.value as number)}
                                >
                                    <MenuItem value=''>None</MenuItem>
                                    {groups.map(g => (
                                        <MenuItem
                                            key={g.id}
                                            value={g.id}
                                        >
                                            {g.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </section>
                    )}

                    <section className={styles.section}>
                        <Typography
                            variant='overline'
                            className={styles.sectionTitle}
                        >
                            Product
                        </Typography>
                        <div className={styles.fields}>
                            <Autocomplete<CreatableCategory>
                                options={categories}
                                value={category}
                                getOptionLabel={o => o.inputValue ? `Add "${o.inputValue}"` : o.name}
                                filterOptions={(opts, params) => {
                                    const filtered = categoryFilter(opts, params)
                                    if (params.inputValue && !opts.some(o => o.name.toLowerCase() === params.inputValue.toLowerCase())) {
                                        filtered.push({id: -1, name: params.inputValue, inputValue: params.inputValue})
                                    }
                                    return filtered
                                }}
                                onChange={(_, v) => {
                                    if (!v) { setCategory(null); return }
                                    if (v.inputValue) {
                                        createCategory(v.inputValue).then(c => {
                                            setCategories(p => [...p, c])
                                            setCategory(c)
                                        })
                                    } else {
                                        setCategory(v)
                                    }
                                }}
                                selectOnFocus
                                clearOnBlur
                                handleHomeEndKeys
                                renderInput={params => (
                                    <TextField
                                        {...params}
                                        label='Category'
                                        size='small'
                                        required={props.mode === 'create'}
                                    />
                                )}
                            />
                            <Autocomplete<CreatableBrand>
                                options={brands}
                                value={brand}
                                getOptionLabel={o => o.inputValue ? `Add "${o.inputValue}"` : o.name}
                                filterOptions={(opts, params) => {
                                    const filtered = brandFilter(opts, params)
                                    if (params.inputValue && !opts.some(o => o.name.toLowerCase() === params.inputValue.toLowerCase())) {
                                        filtered.push({id: -1, name: params.inputValue, inputValue: params.inputValue})
                                    }
                                    return filtered
                                }}
                                onChange={(_, v) => {
                                    if (!v) { setBrand(null); return }
                                    if (v.inputValue) {
                                        createBrand(v.inputValue).then(b => {
                                            setBrands(p => [...p, b])
                                            setBrand(b)
                                        })
                                    } else {
                                        setBrand(v)
                                    }
                                }}
                                selectOnFocus
                                clearOnBlur
                                handleHomeEndKeys
                                renderInput={params => (
                                    <TextField
                                        {...params}
                                        label='Brand'
                                        size='small'
                                    />
                                )}
                            />
                            <TextField
                                label='Variant'
                                size='small'
                                value={variant}
                                onChange={e => setVariant(e.target.value)}
                            />
                            <Autocomplete<CreatableFlavor, true>
                                multiple
                                disableCloseOnSelect
                                options={flavors}
                                value={selectedFlavors}
                                getOptionLabel={o => o.inputValue ? `Add "${o.inputValue}"` : o.name}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                filterOptions={(opts, params) => {
                                    const filtered = flavorFilter(opts, params)
                                    if (params.inputValue && !opts.some(o => o.name.toLowerCase() === params.inputValue.toLowerCase())) {
                                        filtered.push({id: -1, name: params.inputValue, inputValue: params.inputValue})
                                    }
                                    return filtered
                                }}
                                onChange={(_, v) => {
                                    const newItem = v.find(f => f.inputValue)
                                    if (newItem?.inputValue) {
                                        createFlavor(newItem.inputValue).then(f => {
                                            setFlavors(p => [...p, f])
                                            setSelectedFlavors([...v.filter(sf => !sf.inputValue), f])
                                        })
                                    } else {
                                        setSelectedFlavors(v)
                                    }
                                }}
                                selectOnFocus
                                clearOnBlur
                                handleHomeEndKeys
                                renderOption={(props, option, {selected}) => {
                                    const {key, ...rest} = props as React.HTMLAttributes<HTMLLIElement> & {key: React.Key}
                                    return (
                                        <li
                                            key={key}
                                            {...rest}
                                        >
                                            {!option.inputValue && (
                                                <Checkbox
                                                    icon={<CheckBoxOutlineBlankIcon fontSize='small'/>}
                                                    checkedIcon={<CheckBoxIcon fontSize='small'/>}
                                                    checked={selected}
                                                    style={{marginRight: 8, padding: 0}}
                                                />
                                            )}
                                            {option.inputValue ? `Add "${option.inputValue}"` : option.name}
                                        </li>
                                    )
                                }}
                                renderInput={params => (
                                    <TextField
                                        {...params}
                                        label='Flavors'
                                        size='small'
                                    />
                                )}
                            />
                        </div>
                    </section>

                    <section className={styles.section}>
                        <Typography
                            variant='overline'
                            className={styles.sectionTitle}
                        >
                            My review
                        </Typography>
                        <div className={styles.card}>
                            <Typography
                                variant='caption'
                                color='text.secondary'
                            >
                                Rating
                            </Typography>
                            <RatingPicker
                                value={myRating}
                                onChange={setMyRating}
                            />
                            <TextField
                                label='Comment'
                                size='small'
                                multiline
                                minRows={2}
                                fullWidth
                                value={myComment}
                                onChange={e => setMyComment(e.target.value)}
                                className={styles.commentField}
                            />
                        </div>
                    </section>

                    {otherUsers.length > 0 && (
                        <section className={styles.section}>
                            <Typography
                                variant='overline'
                                className={styles.sectionTitle}
                            >
                                Others
                            </Typography>
                            <div className={styles.otherCards}>
                                {otherUsers.map(u => (
                                    <div
                                        key={u.userId}
                                        className={styles.card}
                                    >
                                        <Typography
                                            variant='subtitle2'
                                            className={styles.cardName}
                                        >
                                            {u.name}
                                        </Typography>
                                        {canEditOthers ? (
                                            <>
                                                <Typography
                                                    variant='caption'
                                                    color='text.secondary'
                                                >
                                                    Rating
                                                </Typography>
                                                <RatingPicker
                                                    value={othersRatings[u.userId] ?? null}
                                                    onChange={v => setOthersRatings(prev => ({...prev, [u.userId]: v}))}
                                                />
                                                <TextField
                                                    label='Comment'
                                                    size='small'
                                                    multiline
                                                    minRows={2}
                                                    fullWidth
                                                    value={othersComments[u.userId] ?? ''}
                                                    onChange={e => setOthersComments(prev => ({...prev, [u.userId]: e.target.value}))}
                                                    className={styles.commentField}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                {u.savedRating !== undefined && (
                                                    <Typography variant='body2'>
                                                        Rating: <strong>{u.savedRating}</strong>
                                                    </Typography>
                                                )}
                                                {u.savedComment && (
                                                    <Typography
                                                        variant='body2'
                                                        className={styles.otherComment}
                                                    >
                                                        {u.savedComment}
                                                    </Typography>
                                                )}
                                                {u.savedRating === undefined && !u.savedComment && (
                                                    <Typography
                                                        variant='body2'
                                                        color='text.disabled'
                                                    >
                                                        No review yet
                                                    </Typography>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </DialogContent>
            )}

            <Divider/>
            <DialogActions>
                <Button onClick={handleClose}>
                    Cancel
                </Button>
                <Button
                    variant='contained'
                    onClick={handleSave}
                    disabled={saving || loading || (props.mode === 'create' && !category)}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    )
}
