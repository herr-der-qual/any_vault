import {useState, useEffect} from 'react'
import {Dialog, DialogContent, Snackbar} from '@mui/material'
import {getGroupMembers} from '@/app/api/groups'
import {createProductBulk} from '@/app/api/products'
import {useAuthenticationStore} from '@/app/store/authenticationStore'
import {NavBar} from '@/shared/ui/NavBar'
import type {SelectOption} from '@/shared/ui/SearchableSelect'
import {GroupStep} from './GroupStep/GroupStep'
import {CategoryStep} from './CategoryStep/CategoryStep'
import {BrandStep} from './BrandStep/BrandStep'
import {VariantStep} from './VariantStep/VariantStep'
import {FlavorsStep} from './FlavorsStep/FlavorsStep'
import {RateStep} from './RateStep/RateStep'
import {CommentStep} from './CommentStep/CommentStep'
import {SummaryStep} from './SummaryStep/SummaryStep'
import styles from './CreateProductFlow.module.scss'

interface Rater {
    userId: number
    name: string
}

interface Props {
    open: boolean
    onClose: () => void
}

export function CreateProductFlow({open, onClose}: Props) {
    const currentUser = useAuthenticationStore(state => state.user)
    const [step, setStep] = useState(0)
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
    const [categoryId, setCategoryId] = useState<number | null>(null)
    const [categoryLabel, setCategoryLabel] = useState('')
    const [brandId, setBrandId] = useState<number | null>(null)
    const [brandLabel, setBrandLabel] = useState('')
    const [variant, setVariant] = useState('')
    const [selectedFlavors, setSelectedFlavors] = useState<SelectOption[]>([])
    const [raters, setRaters] = useState<Rater[]>([])
    const [ratings, setRatings] = useState<(number | null)[]>([])
    const [comments, setComments] = useState<string[]>([])
    const [snackbarOpen, setSnackbarOpen] = useState(false)

    useEffect(() => {
        if (!open || !currentUser) return
        const currentRater: Rater = {
            userId: currentUser.id,
            name: `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.username,
        }
        if (selectedGroupId) {
            getGroupMembers(selectedGroupId).then(members => {
                const others = members
                    .filter(m => m.user_id !== currentUser.id)
                    .map(m => ({
                        userId: m.user_id,
                        name: `${m.first_name} ${m.last_name}`.trim() || m.username,
                    }))
                const all = [currentRater, ...others]
                setRaters(all)
                setRatings(all.map(() => null))
                setComments(all.map(() => ''))
            })
        } else {
            setRaters([currentRater])
            setRatings([null])
            setComments([''])
        }
    }, [open, currentUser, selectedGroupId])

    const handleClose = () => {
        setStep(0)
        setSelectedGroupId(null)
        setCategoryId(null)
        setCategoryLabel('')
        setBrandId(null)
        setBrandLabel('')
        setVariant('')
        setSelectedFlavors([])
        setRatings(raters.map(() => null))
        setComments(raters.map(() => ''))
        onClose()
    }

    const handleBack = () => {
        if (step === 0) handleClose()
        else setStep(step - 1)
    }

    const handleGroupSelect = (groupId: number | null) => {
        setSelectedGroupId(groupId)
        setStep(1)
    }

    const handleCategorySelect = (option: SelectOption) => {
        setCategoryId(option.id)
        setCategoryLabel(option.label)
        setStep(2)
    }

    const handleBrandSelect = (option: SelectOption) => {
        setBrandId(option.id)
        setBrandLabel(option.label)
        setStep(3)
    }

    const offset = step - 5
    const isCommentStep = offset >= raters.length
    const raterIndex = isCommentStep ? offset - raters.length : offset
    const currentRater = raters[raterIndex]

    const handleRatingChange = (value: number) => {
        setRatings(prev => {
            const next = [...prev]
            next[raterIndex] = value
            return next
        })
    }

    const handleCommentChange = (value: string) => {
        setComments(prev => {
            const next = [...prev]
            next[raterIndex] = value
            return next
        })
    }

    const handleSubmit = async () => {
        if (!categoryId) return
        await createProductBulk({
            category: categoryId,
            brand: brandId,
            variant,
            flavors: selectedFlavors.map(f => f.id),
            groups: selectedGroupId ? [selectedGroupId] : [],
            entries: raters.map((r, i) => ({
                user_id: r.userId,
                rating: ratings[i] ?? null,
                comment: comments[i] ?? '',
            })),
        })
        setSnackbarOpen(true)
        handleClose()
    }

    return (
        <>
            <Dialog open={open} onClose={handleClose} fullScreen>
                <NavBar title='New product' onBack={handleBack}/>
                <DialogContent className={styles.content}>
                    {step === 0 && <GroupStep onSelect={handleGroupSelect}/>}
                    {step === 1 && <CategoryStep onSelect={handleCategorySelect}/>}
                    {step === 2 && <BrandStep onSelect={handleBrandSelect}/>}
                    {step === 3 &&
                        <VariantStep
                            value={variant}
                            onChange={setVariant}
                            onNext={() => setStep(4)}
                        />
                    }
                    {step === 4 &&
                        <FlavorsStep
                            selected={selectedFlavors}
                            onChange={setSelectedFlavors}
                            onNext={() => setStep(5)}
                        />
                    }
                    {step >= 5 && currentRater && !isCommentStep && (
                        <RateStep
                            name={currentRater.name}
                            value={ratings[raterIndex] ?? null}
                            onChange={handleRatingChange}
                            onNext={() => setStep(step + 1)}
                        />
                    )}
                    {step >= 5 && currentRater && isCommentStep && (
                        <CommentStep
                            name={currentRater.name}
                            value={comments[raterIndex] ?? ''}
                            onChange={handleCommentChange}
                            onNext={() => setStep(step + 1)}
                        />
                    )}
                    {step === 5 + raters.length * 2 && (
                        <SummaryStep
                            category={categoryLabel}
                            brand={brandLabel}
                            variant={variant}
                            flavors={selectedFlavors.map(f => f.label)}
                            raters={raters.map((r, i) => ({
                                name: r.name,
                                rating: ratings[i] ?? null,
                                comment: comments[i] ?? '',
                            }))}
                            onSubmit={handleSubmit}
                        />
                    )}
                </DialogContent>
            </Dialog>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message='Product added'
            />
        </>
    )
}
