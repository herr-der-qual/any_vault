import {useState, useEffect} from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Typography, Divider, Autocomplete,
    CircularProgress, Checkbox,
} from '@mui/material'
import {CheckBox as CheckBoxIcon, CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon} from '@mui/icons-material'
import {useAuthenticationStore} from '@/app/store/authenticationStore'
import {getCategories, createCategory, type Category} from '@/app/api/categories'
import {getBrands, createBrand, type Brand} from '@/app/api/brands'
import {getFlavors, createFlavor, type Flavor} from '@/app/api/flavors'
import {updateProduct, rateProduct, commentProduct, type ProductRow} from '@/app/api/products'
import styles from './ProductEditDialog.module.scss'

interface Props {
    product: ProductRow
    memberNames: Record<number, string>
    canEditOthers: boolean
    onClose: () => void
    onSaved: () => void
}

function RatingPicker({value, onChange}: {value: number | null; onChange: (v: number | null) => void}) {
    return (
        <div className={styles.ratingButtons}>
            {Array.from({length: 10}, (_, i) => i + 1).map(n => (
                <button
                    key={n}
                    type='button'
                    className={`${styles.rateBtn} ${value === n ? styles.rateBtnSelected : ''}`}
                    onClick={() => onChange(value === n ? null : n)}
                >
                    {n}
                </button>
            ))}
        </div>
    )
}

export function ProductEditDialog({product, memberNames, canEditOthers, onClose, onSaved}: Props) {
    const currentUser = useAuthenticationStore(state => state.user)

    const [categories, setCategories] = useState<Category[]>([])
    const [brands, setBrands] = useState<Brand[]>([])
    const [flavors, setFlavors] = useState<Flavor[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [category, setCategory] = useState<Category | null>(null)
    const [brand, setBrand] = useState<Brand | null>(null)
    const [variant, setVariant] = useState(product.variant)
    const [selectedFlavors, setSelectedFlavors] = useState<Flavor[]>([])
    const [myRating, setMyRating] = useState<number | null>(null)
    const [myComment, setMyComment] = useState('')
    const [othersRatings, setOthersRatings] = useState<Record<number, number | null>>({})
    const [othersComments, setOthersComments] = useState<Record<number, string>>({})

    useEffect(() => {
        Promise.all([getCategories(), getBrands(), getFlavors()]).then(([cats, brs, fls]) => {
            setCategories(cats)
            setBrands(brs)
            setFlavors(fls)
            setCategory(cats.find(c => c.id === product.category_id) ?? null)
            setBrand(brs.find(b => b.id === product.brand_id) ?? null)
            setSelectedFlavors(fls.filter(f => product.flavor_ids.includes(f.id)))
            setLoading(false)
        })
        const myR = product.ratings.find(r => r.user_id === currentUser?.id)
        const myC = product.comments.find(c => c.user_id === currentUser?.id)
        setMyRating(myR?.value ?? null)
        setMyComment(myC?.text ?? '')

        const initRatings: Record<number, number | null> = {}
        const initComments: Record<number, string> = {}
        for (const r of product.ratings) {
            if (r.user_id !== currentUser?.id) {
                initRatings[r.user_id] = r.value
            }
        }
        for (const c of product.comments) {
            if (c.user_id !== currentUser?.id) {
                initComments[c.user_id] = c.text
            }
        }
        setOthersRatings(initRatings)
        setOthersComments(initComments)
    }, [product.id])

    const handleSave = async () => {
        setSaving(true)
        try {
            const resolvedCategoryId = category?.id ?? product.category_id
            const resolvedBrandId = brand !== undefined ? (brand?.id ?? null) : product.brand_id

            await updateProduct(product.id, {
                category: resolvedCategoryId,
                brand: resolvedBrandId,
                variant,
                flavors: selectedFlavors.map(f => f.id),
            })
            await rateProduct(product.id, myRating)
            await commentProduct(product.id, myComment)

            if (canEditOthers) {
                const saves: Promise<unknown>[] = []
                for (const uid of otherUserIds) {
                    saves.push(rateProduct(product.id, othersRatings[uid] ?? null, uid))
                    saves.push(commentProduct(product.id, othersComments[uid] ?? '', uid))
                }
                await Promise.all(saves)
            }

            onSaved()
        } finally {
            setSaving(false)
        }
    }

    const title = [product.brand, product.variant].filter(Boolean).join(' ') || product.category

    const otherUserIds = [
        ...new Set([
            ...product.ratings.map(r => r.user_id),
            ...product.comments.map(c => c.user_id),
        ]),
    ].filter(id => id !== currentUser?.id)

    return (
        <Dialog
            open
            fullScreen
            onClose={onClose}
        >
            <DialogTitle className={styles.title}>
                <div>
                    <Typography variant='h6'>
                        {title}
                    </Typography>
                    <Typography
                        variant='body2'
                        color='text.secondary'
                    >
                        {product.category}
                    </Typography>
                </div>
                <Button onClick={onClose}>
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
                    <section className={styles.section}>
                        <Typography
                            variant='overline'
                            className={styles.sectionTitle}
                        >
                            Product
                        </Typography>
                        <div className={styles.fields}>
                            <Autocomplete
                                options={categories}
                                getOptionLabel={c => c.name}
                                value={category}
                                onChange={(_, v) => setCategory(v)}
                                renderInput={params => (
                                    <TextField
                                        {...params}
                                        label='Category'
                                        size='small'
                                    />
                                )}
                            />
                            <Autocomplete
                                options={brands}
                                getOptionLabel={b => b.name}
                                value={brand}
                                onChange={(_, v) => setBrand(v)}
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
                            <Autocomplete
                                multiple
                                disableCloseOnSelect
                                options={flavors}
                                getOptionLabel={f => f.name}
                                value={selectedFlavors}
                                onChange={(_, v) => setSelectedFlavors(v)}
                                renderOption={(props, option, {selected}) => {
                                    const {key, ...rest} = props as React.HTMLAttributes<HTMLLIElement> & {key: React.Key}
                                    return (
                                        <li
                                            key={key}
                                            {...rest}
                                        >
                                            <Checkbox
                                                icon={<CheckBoxOutlineBlankIcon fontSize='small'/>}
                                                checkedIcon={<CheckBoxIcon fontSize='small'/>}
                                                checked={selected}
                                                style={{marginRight: 8, padding: 0}}
                                            />
                                            {option.name}
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

                    {otherUserIds.length > 0 && (
                        <section className={styles.section}>
                            <Typography
                                variant='overline'
                                className={styles.sectionTitle}
                            >
                                Others
                            </Typography>
                            <div className={styles.otherCards}>
                                {otherUserIds.map(uid => {
                                    const name = memberNames[uid] ?? `User ${uid}`
                                    if (canEditOthers) {
                                        return (
                                            <div
                                                key={uid}
                                                className={styles.card}
                                            >
                                                <Typography
                                                    variant='subtitle2'
                                                    className={styles.cardName}
                                                >
                                                    {name}
                                                </Typography>
                                                <Typography
                                                    variant='caption'
                                                    color='text.secondary'
                                                >
                                                    Rating
                                                </Typography>
                                                <RatingPicker
                                                    value={othersRatings[uid] ?? null}
                                                    onChange={v => setOthersRatings(prev => ({...prev, [uid]: v}))}
                                                />
                                                <TextField
                                                    label='Comment'
                                                    size='small'
                                                    multiline
                                                    minRows={2}
                                                    fullWidth
                                                    value={othersComments[uid] ?? ''}
                                                    onChange={e => setOthersComments(prev => ({...prev, [uid]: e.target.value}))}
                                                    className={styles.commentField}
                                                />
                                            </div>
                                        )
                                    }

                                    const rating = product.ratings.find(r => r.user_id === uid)
                                    const comment = product.comments.find(c => c.user_id === uid)
                                    return (
                                        <div
                                            key={uid}
                                            className={styles.card}
                                        >
                                            <Typography
                                                variant='subtitle2'
                                                className={styles.cardName}
                                            >
                                                {name}
                                            </Typography>
                                            {rating && (
                                                <Typography variant='body2'>
                                                    Rating: <strong>{rating.value}</strong>
                                                </Typography>
                                            )}
                                            {comment?.text && (
                                                <Typography
                                                    variant='body2'
                                                    className={styles.otherComment}
                                                >
                                                    {comment.text}
                                                </Typography>
                                            )}
                                            {!rating && !comment?.text && (
                                                <Typography
                                                    variant='body2'
                                                    color='text.disabled'
                                                >
                                                    No review yet
                                                </Typography>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    )}
                </DialogContent>
            )}

            <Divider/>
            <DialogActions>
                <Button onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant='contained'
                    onClick={handleSave}
                    disabled={saving || loading}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    )
}
