import { motion } from 'motion/react'
import { useElements } from '@/api/catalog'
import { useMe } from '@/api/me'
import { EASE_CALM, PRACTICE_FIGURE_LAYOUT_ID, WALK_IN_MS } from '@/app/motion'
import { paths } from '@/app/routes'
import { useTransitionKind } from '@/app/RootLayout'
import { PracticeFigure } from '@/art/objectIcons'
import { ButtonLink } from '@/ui/Button'
import { MainNav } from '@/ui/MainNav'
import { Screen, Spacer } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import styles from './HomeScreen.module.css'

export function HomeScreen() {
  const meQuery = useMe()
  const elementsQuery = useElements()
  const { kind, reducedMotion } = useTransitionKind()

  if (meQuery.isPending || elementsQuery.isPending) {
    return (
      <Screen>
        <Loading />
      </Screen>
    )
  }
  if (meQuery.isError) {
    return (
      <Screen>
        <ErrorState error={meQuery.error} onRetry={() => meQuery.refetch()} />
      </Screen>
    )
  }

  const practice = meQuery.data.practice
  const elementSlug = practice ? elementsQuery.data?.find((e) => e.id === practice.element_id)?.slug : undefined
  const begin = practice ? paths.sit : paths.mode

  const walkInFade =
    kind === 'walkIn' && !reducedMotion
      ? { exit: { opacity: 0 }, transition: { duration: WALK_IN_MS / 1000, ease: EASE_CALM } }
      : {}

  return (
    <Screen>
      <motion.div className={styles.wordmark} {...walkInFade}>
        Stay
      </motion.div>

      <Spacer />
      <div className={styles.centre}>
        <motion.div
          className={styles.figure}
          layout={!reducedMotion}
          layoutId={PRACTICE_FIGURE_LAYOUT_ID}
          transition={{ duration: reducedMotion ? 0 : WALK_IN_MS / 1000, ease: EASE_CALM }}
        >
          <PracticeFigure slug={elementSlug} />
        </motion.div>
        <motion.p className={styles.tagline} {...walkInFade}>
          Choose your object.
          <br />
          Stay with it.
        </motion.p>
      </div>
      <Spacer />

      <motion.div className={styles.actions} {...walkInFade}>
        <ButtonLink to={begin}>Begin</ButtonLink>
        <MainNav />
      </motion.div>
    </Screen>
  )
}
