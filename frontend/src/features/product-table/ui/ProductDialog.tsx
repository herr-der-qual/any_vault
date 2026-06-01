import {useState, useEffect} from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Typography, Divider,
    CircularProgress, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox,
} from '@mui/material'
import {useAuthenticationStore} from '@/app/store/authenticationStore'
import {getMyGroups, getGroupMembers} from '@/app/api/groups'
import {getCategories, createCategory, renameCategory, deleteCategory, type Category} from '@/app/api/categories'
import {getBrands, createBrand, renameBrand, deleteBrand, type Brand} from '@/app/api/brands'
import {CatalogSelect} from '@/shared/ui/CatalogSelect'
import {getFlavors, createFlavor, renameFlavor, deleteFlavor, updateFlavorColor, type Flavor} from '@/app/api/flavors'
import {getColors, type Color} from '@/app/api/colors'
import {createProductBulk, updateProduct, rateProduct, commentProduct, type ProductRow} from '@/app/api/products'
import type {Group} from '@/entities/group'
import {RatingPicker} from '@/shared/ui/RatingPicker'
import {ColoredMultiSelect, type ColoredOption} from '@/shared/ui/ColoredMultiSelect'
import {FlavorEditDialog} from './FlavorEditDialog'
import {CatalogItemEditDialog} from './CatalogItemEditDialog'
import styles from './ProductDialog.module.scss'


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
        groupId: number
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
    const [colors, setColors] = useState<Color[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const [category, setCategory] = useState<Category | null>(null)
    const [brand, setBrand] = useState<Brand | null>(null)
    const [variant, setVariant] = useState('')
    const [noSugar, setNoSugar] = useState(false)
    const [selectedFlavors, setSelectedFlavors] = useState<ColoredOption<Flavor>[]>([])
    const [myRating, setMyRating] = useState<number | null>(null)
    const [myComment, setMyComment] = useState('')
    const [otherUsers, setOtherUsers] = useState<OtherUser[]>([])
    const [othersRatings, setOthersRatings] = useState<Record<number, number | null>>({})
    const [othersComments, setOthersComments] = useState<Record<number, string>>({})
    const [editingFlavor, setEditingFlavor] = useState<{flavor: Flavor; position: {top: number; left: number}} | null>(null)
    const [editingBrand, setEditingBrand] = useState<{brand: Brand; position: {top: number; left: number}} | null>(null)
    const [editingCategory, setEditingCategory] = useState<{category: Category; position: {top: number; left: number}} | null>(null)

    const canEditCatalog = props.mode === 'edit'
        ? props.canEditOthers
        : groups.find(g => g.id === (typeof selectedGroupId === 'number' ? selectedGroupId : -1))?.role !== 'view_only'

    const productId = props.mode === 'edit' ? props.product.id : null

    useEffect(() => {
        if (!open) return
        setLoading(true)

        if (props.mode === 'create') {
            Promise.all([getMyGroups(), getCategories(), getBrands(), getFlavors(), getColors()]).then(
                ([grps, cats, brs, fls, cls]) => {
                    setGroups(grps)
                    setCategories(cats)
                    setBrands(brs)
                    setFlavors(fls)
                    setColors(cls)
                    setSelectedGroupId(grps[0]?.id ?? '')
                    setLoading(false)
                }
            )
        } else {
            const product = props.product
            Promise.all([getCategories(), getBrands(), getFlavors(), getColors()]).then(([cats, brs, fls, cls]) => {
                setCategories(cats)
                setBrands(brs)
                setFlavors(fls)
                setColors(cls)
                setCategory(cats.find(c => c.id === product.category_id) ?? null)
                setBrand(brs.find(b => b.id === product.brand_id) ?? null)
                setSelectedFlavors(fls.filter(f => product.flavor_ids.includes(f.id)).map(f => ({item: f, color: f.color ?? null})))
                setLoading(false)
            })
            setVariant(product.variant)
        setNoSugar(product.no_sugar)
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
            setNoSugar(false)
            setSelectedFlavors([])
            setMyRating(null)
            setMyComment('')
            setOthersRatings({})
            setOthersComments({})
        }
        onClose()
    }

    const handleFlavorEditSave = async (name: string, color: Color | null) => {
        if (!editingFlavor) return
        const {flavor} = editingFlavor
        if (name !== flavor.name) await renameFlavor(flavor.id, name)
        const currentColorId = selectedFlavors.find(sf => sf.item.id === flavor.id)?.color?.id ?? null
        if ((color?.id ?? null) !== currentColorId) await updateFlavorColor(flavor.id, color?.id ?? null)
        const updatedFlavor = {...flavor, name, color}
        setFlavors(prev => prev.map(f => f.id === flavor.id ? updatedFlavor : f))
        setSelectedFlavors(prev => prev.map(sf => sf.item.id === flavor.id ? {...sf, item: updatedFlavor, color} : sf))
    }

    const handleFlavorDelete = async () => {
        if (!editingFlavor) return
        const id = editingFlavor.flavor.id
        await deleteFlavor(id)
        setFlavors(prev => prev.filter(f => f.id !== id))
        setSelectedFlavors(prev => prev.filter(sf => sf.item.id !== id))
        setEditingFlavor(null)
    }

    const saveFlavorColors = async () => {
        const changed = selectedFlavors.filter(sf => (sf.color?.id ?? null) !== (sf.item.color?.id ?? null))
        await Promise.all(changed.map(sf => updateFlavorColor(sf.item.id, sf.color?.id ?? null)))
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
                    no_sugar: noSugar,
                    flavors: selectedFlavors.map(f => f.item.id),
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
                await saveFlavorColors()
                window.dispatchEvent(new CustomEvent('productCreated'))
            } else {
                const product = props.product
                await updateProduct(product.id, {
                    category: category?.id ?? product.category_id,
                    brand: brand !== undefined ? (brand?.id ?? null) : product.brand_id,
                    variant,
                    no_sugar: noSugar,
                    flavors: selectedFlavors.map(f => f.item.id),
                })
                await rateProduct(product.id, myRating)
                await commentProduct(product.id, myComment)
                if (props.canEditOthers) {
                    await Promise.all(otherUsers.flatMap(u => [
                        rateProduct(product.id, othersRatings[u.userId] ?? null, u.userId),
                        commentProduct(product.id, othersComments[u.userId] ?? '', u.userId),
                    ]))
                }
                await saveFlavorColors()
            }
            onSaved()
            handleClose()
        } finally {
            setSaving(false)
        }
    }

    const activeGroupId = props.mode === 'edit' ? props.groupId : (typeof selectedGroupId === 'number' ? selectedGroupId : null)

    const title = props.mode === 'create'
        ? 'New product'
        : [props.product.brand, props.product.variant].filter(Boolean).join(' ') || props.product.category

    const canEditOthers = props.mode === 'create' || props.canEditOthers

    return (
        <>
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
                            <CatalogSelect<Category>
                                options={categories}
                                value={category}
                                onChange={setCategory}
                                onCreate={async name => {
                                    const c = await createCategory(name, activeGroupId)
                                    setCategories(p => [...p, c])
                                    return c
                                }}
                                canEdit={c => canEditCatalog && c.group_id !== null}
                                onEditClick={(c, position) => setEditingCategory({category: c, position})}
                                keepOpen={editingCategory !== null}
                                label='Category'
                                required={props.mode === 'create'}
                            />
                            <CatalogSelect<Brand>
                                options={brands}
                                value={brand}
                                onChange={setBrand}
                                onCreate={async name => {
                                    const b = await createBrand(name, activeGroupId)
                                    setBrands(p => [...p, b])
                                    return b
                                }}
                                canEdit={b => canEditCatalog && b.group_id !== null}
                                onEditClick={(b, position) => setEditingBrand({brand: b, position})}
                                keepOpen={editingBrand !== null}
                                label='Brand'
                            />
                            <TextField
                                label='Variant'
                                size='small'
                                value={variant}
                                onChange={e => setVariant(e.target.value)}
                            />
                            <ColoredMultiSelect<Flavor>
                                options={flavors}
                                value={selectedFlavors}
                                colors={colors}
                                onChange={setSelectedFlavors}
                                onCreate={async label => {
                                    const f = await createFlavor(label, activeGroupId)
                                    setFlavors(prev => [...prev, f])
                                    return f
                                }}
                                canEdit={f => f.group_id !== null}
                                onEditClick={(f, position) => setEditingFlavor({flavor: f, position})}
                                keepOpen={editingFlavor !== null}
                                label='Flavors'
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={noSugar}
                                        onChange={e => setNoSugar(e.target.checked)}
                                        size='small'
                                    />
                                }
                                label='No sugar'
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
            <DialogActions className={styles.actions}>
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

        {editingFlavor && (
            <FlavorEditDialog
                position={editingFlavor.position}
                flavor={editingFlavor.flavor}
                initialColor={selectedFlavors.find(sf => sf.item.id === editingFlavor.flavor.id)?.color ?? editingFlavor.flavor.color}
                colors={colors}
                onClose={() => setEditingFlavor(null)}
                onSave={handleFlavorEditSave}
                onDelete={handleFlavorDelete}
            />
        )}

        <CatalogItemEditDialog
            position={editingCategory?.position ?? null}
            name={editingCategory?.category.name ?? ''}
            onClose={() => setEditingCategory(null)}
            onSave={async name => {
                if (!editingCategory) return
                await renameCategory(editingCategory.category.id, name)
                setCategories(prev => prev.map(c => c.id === editingCategory.category.id ? {...c, name} : c))
                if (category?.id === editingCategory.category.id) setCategory(prev => prev ? {...prev, name} : prev)
                setEditingCategory(null)
            }}
            onDelete={async () => {
                if (!editingCategory) return
                await deleteCategory(editingCategory.category.id)
                setCategories(prev => prev.filter(c => c.id !== editingCategory.category.id))
                if (category?.id === editingCategory.category.id) setCategory(null)
            }}
        />

        <CatalogItemEditDialog
            position={editingBrand?.position ?? null}
            name={editingBrand?.brand.name ?? ''}
            onClose={() => setEditingBrand(null)}
            onSave={async name => {
                if (!editingBrand) return
                await renameBrand(editingBrand.brand.id, name)
                setBrands(prev => prev.map(b => b.id === editingBrand.brand.id ? {...b, name} : b))
                if (brand?.id === editingBrand.brand.id) setBrand(prev => prev ? {...prev, name} : prev)
                setEditingBrand(null)
            }}
            onDelete={async () => {
                if (!editingBrand) return
                await deleteBrand(editingBrand.brand.id)
                setBrands(prev => prev.filter(b => b.id !== editingBrand.brand.id))
                if (brand?.id === editingBrand.brand.id) setBrand(null)
            }}
        />
        </>
    )
}
