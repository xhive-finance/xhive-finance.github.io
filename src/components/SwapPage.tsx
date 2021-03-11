import React, { ReactElement, useState } from "react"
import { formatBNToPercentString, formatBNToString } from "../utils"
import { BigNumber } from "@ethersproject/bignumber"
import ConfirmTransaction from "./ConfirmTransaction"

import Modal from "./Modal"
import ReviewSwap from "./ReviewSwap"
import SwapForm from "./material/SwapForm"
import { isHighPriceImpact } from "../utils/priceImpact"
import { logEvent } from "../utils/googleAnalytics"
import { useActiveWeb3React } from "../hooks"
import { useTranslation } from "react-i18next"
import {
  Button,
  Container,
  createStyles,
  Grid,
  makeStyles,
  Paper,
  Typography,
} from "@material-ui/core"
import SwapHorizontalCircleIcon from "@material-ui/icons/SwapHorizontalCircle"
import { StyledChip } from "./material/StyledChip"
import AdvancedPanel from "./material/AdvancedPanel"

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
    },
  }),
)

interface Props {
  tokens: Array<{
    symbol: string
    name: string
    value: BigNumber
    icon: string
    decimals: number
  }>
  exchangeRateInfo: {
    pair: string
    exchangeRate: BigNumber
    priceImpact: BigNumber
  }
  error: string | null
  fromState: { symbol: string; value: string }
  toState: { symbol: string; value: string }
  onChangeFromToken: (tokenSymbol: string) => void
  onChangeFromAmount: (amount: string) => void
  onChangeToToken: (tokenSymbol: string) => void
  onConfirmTransaction: () => Promise<void>
  onClickReverseExchangeDirection: () => void
}

const SwapPage = (props: Props): ReactElement => {
  const { t } = useTranslation()
  const { account } = useActiveWeb3React()
  const {
    tokens,
    exchangeRateInfo,
    error,
    fromState,
    toState,
    onChangeFromToken,
    onChangeFromAmount,
    onChangeToToken,
    onConfirmTransaction,
    onClickReverseExchangeDirection,
  } = props

  const [currentModal, setCurrentModal] = useState<string | null>(null)
  const classes = useStyles()

  const formattedPriceImpact = formatBNToPercentString(
    exchangeRateInfo.priceImpact,
    18,
  )
  const formattedExchangeRate = formatBNToString(
    exchangeRateInfo.exchangeRate,
    18,
    4,
  )

  return (
    <Container maxWidth="md">
      <Grid container direction="column" spacing={2}>
        <Grid
          item
          container
          direction="row"
          className={classes.root}
          spacing={2}
        >
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" className={classes.paper}>
              <SwapForm
                isSwapFrom={true}
                tokens={tokens}
                onChangeSelected={onChangeFromToken}
                onChangeAmount={onChangeFromAmount}
                selected={fromState.symbol}
                inputValue={fromState.value}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" className={classes.paper}>
              <SwapForm
                isSwapFrom={false}
                tokens={tokens}
                onChangeSelected={onChangeToToken}
                selected={toState.symbol}
                inputValue={toState.value}
              />
            </Paper>
          </Grid>
        </Grid>
        {account && isHighPriceImpact(exchangeRateInfo.priceImpact) ? (
          <div className="exchangeWarning">
            {t("highPriceImpact", {
              rate: formattedPriceImpact,
            })}
          </div>
        ) : null}
        <Grid container item>
          <AdvancedPanel
            error={error}
            actionComponent={
              <Button
                fullWidth
                variant="contained"
                onClick={(): void => {
                  setCurrentModal("review")
                }}
                disabled={!!error || +toState.value <= 0}
              >
                {t("swap")}
              </Button>
            }
          >
            <Grid item xs>
              <StyledChip
                onClick={onClickReverseExchangeDirection}
                label={exchangeRateInfo.pair}
                icon={<SwapHorizontalCircleIcon />}
                variant="outlined"
              />
            </Grid>
            <Grid item className="cost" xs={1}>
              <Typography color="inherit" component="div" align="center">
                {`${t("price")}: ${formattedExchangeRate}`}
              </Typography>
            </Grid>
          </AdvancedPanel>
        </Grid>
      </Grid>
      <Modal
        isOpen={!!currentModal}
        onClose={(): void => setCurrentModal(null)}
      >
        {currentModal === "review" ? (
          <ReviewSwap
            onClose={(): void => setCurrentModal(null)}
            onConfirm={async (): Promise<void> => {
              setCurrentModal("confirm")
              logEvent("swap", {
                from: fromState.symbol,
                to: toState.symbol,
              })
              await onConfirmTransaction?.()
              setCurrentModal(null)
            }}
            data={{
              from: fromState,
              to: toState,
              exchangeRateInfo,
            }}
          />
        ) : null}
        {currentModal === "confirm" ? <ConfirmTransaction /> : null}
      </Modal>
    </Container>
  )
}
export default SwapPage
