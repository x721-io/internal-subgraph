// import { MatchOrdersCall, DirectAcceptBidCall, DirectPurchaseCall } from "../../generated/ExchangeV2/ExchangeV2"
import { MatchOrdersCall, DirectAcceptBidCall, FillOrder, CancelOrder } from "../../generated/ORDERExchangeV2/Order";
import { BigInt, log } from "@graphprotocol/graph-ts"
// import { initDeal } from '../factory'
// import { calculatePriceAndFee } from '../utils'
import { ContractAddress, ContractName, DealType } from "../enum"
import { Address } from "@graphprotocol/graph-ts/index"
import { fetchOrCreateAccount, fetchOrCreateERC721Tokens, generateCombineKey, updateBlockEntity, updateOwnedTokenCount, updateTotalTransactionCollection, updateTotalVolume, updateTotalVolumeMarket } from "../utils";
import { Order} from "../../generated/schema";

export function handleFillOrder(event : FillOrder ): void {
    let id = generateCombineKey([event.params.sig.toHexString(), event.params.index.toString()])
    let order = Order.load(id);
    if(!order){
        order = new Order(id);
        order.maker = fetchOrCreateAccount(event.params.maker).id;
        if(event.params.taker !== Address.fromString(ContractAddress.ZERO)){
            order.taker = fetchOrCreateAccount(event.params.taker).id;
        }
        order.sig = event.params.sig.toHexString();
        order.index = event.params.index;
        order.status = 'FILLED';
        order.timestamp = event.block.timestamp;
    }
    order.save();
}

export function handleCancleOrder(event: CancelOrder): void {
    let id = generateCombineKey([event.params.sig.toHexString(), event.params.index.toString()]);
    let order = Order.load(id);
    if(!order){
        order = new Order(id);
        order.maker = fetchOrCreateAccount(event.params.maker).id;
        order.sig = event.params.sig.toHexString();
        order.taker = null;
        order.index = event.params.index;
        order.status = 'CANCELED';
        order.timestamp = event.block.timestamp;
    }
    order.save();
}
// export function handleDirectAcceptBid(event: DirectAcceptBidCall ) {

// }

// export function handleDirectPurchase(event: DirectPurchaseCall) {
    
// }
