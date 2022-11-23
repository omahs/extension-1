import { useRef, useState } from "react"
import AutoSizer from "react-virtualized-auto-sizer"
import { VariableSizeList as List } from "react-window"
import useDOMElementObserver from "../../util/hooks/useDOMElementObserver"
import { RichedTransactionMeta } from "../../util/transactionUtils"
import TransactionItem from "./TransactionItem"
import {
    TransactionCategories,
    TransactionStatus,
} from "../../context/commTypes"
import BridgeDetails from "../bridge/BridgeDetails"
import TransactionDetails from "./TransactionDetails"
import { BRIDGE_PENDING_STATUS } from "../../util/bridgeUtils"
import { TransactionMeta } from "@block-wallet/background/controllers/transactions/utils/types"
const DEFAULT_TX_HEIGHT_IN_PX = 76
const getItemHeightInPx = (tx: TransactionMeta) => {
    if (tx.id) {
        if (tx.status === TransactionStatus.SUBMITTED) {
            return 110
        } else if (tx.transactionCategory === TransactionCategories.BRIDGE) {
            return BRIDGE_PENDING_STATUS.includes(tx.bridgeParams!.status!)
                ? 95
                : DEFAULT_TX_HEIGHT_IN_PX
        }
    }
    return DEFAULT_TX_HEIGHT_IN_PX
}

interface watchDetailsType {
    transaction: TransactionMeta
}

const getInitialCount = (transactions: RichedTransactionMeta[]) =>
    transactions.length > 10 ? 10 : transactions.length

const TransactionsList: React.FC<{
    transactions: RichedTransactionMeta[]
}> = ({ transactions }) => {
    const [watchDetails, setWatchDetails] = useState<
        watchDetailsType | undefined
    >()

    const [transactionCount, setTransactionCount] = useState(() =>
        getInitialCount(transactions)
    )
    const [isLoading, setIsLoading] = useState(false)
    const loaderRef = useRef<HTMLImageElement>(null)

    useDOMElementObserver(
        loaderRef,
        async () => {
            const countToLoad = transactions.length - transactionCount
            if (countToLoad === 0) return
            setIsLoading(true)
            await new Promise((resolve) => setTimeout(resolve, 300))
            setTransactionCount(
                transactionCount + (countToLoad > 10 ? 10 : countToLoad)
            )
            setIsLoading(false)
        },
        [transactionCount, transactions]
    )

    const OperationDetails = watchDetails
        ? watchDetails.transaction.transactionCategory
            ? [
                  TransactionCategories.BRIDGE,
                  TransactionCategories.INCOMING_BRIDGE_REFUND,
                  TransactionCategories.INCOMING_BRIDGE,
              ].includes(watchDetails.transaction.transactionCategory)
                ? BridgeDetails
                : TransactionDetails
            : undefined
        : undefined

    return (
        <div className="w-full h-full">
            {OperationDetails && watchDetails?.transaction && (
                <OperationDetails
                    transaction={watchDetails?.transaction}
                    open={true}
                    onClose={() => setWatchDetails(undefined)}
                />
            )}
            <AutoSizer className="hide-scroll">
                {({ width, height }) => (
                    <List
                        height={height}
                        width={width}
                        style={{ overflowX: "hidden" }}
                        itemCount={transactions.length}
                        estimatedItemSize={DEFAULT_TX_HEIGHT_IN_PX}
                        overscanCount={5}
                        itemSize={(index) => {
                            const tx = transactions[index]
                            return getItemHeightInPx(tx)
                        }} // height in px
                        itemData={transactions}
                        className="hide-scroll"
                    >
                        {({ style, data, index }) => (
                            <div style={style} key={data[index].id || index}>
                                {index > 0 ? <hr /> : null}
                                <TransactionItem
                                    onClick={() =>
                                        setWatchDetails({
                                            transaction: data[index],
                                        })
                                    }
                                    itemHeight={getItemHeightInPx(data[index])}
                                    transaction={data[index]}
                                    index={index}
                                />
                            </div>
                        )}
                    </List>
                )}
            </AutoSizer>
        </div>
    )
}

export default TransactionsList
