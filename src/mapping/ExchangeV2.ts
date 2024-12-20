import { BigInt, log } from '@graphprotocol/graph-ts';
// import { MatchOrdersCall, DirectAcceptBidCall, DirectPurchaseCall } from "../../generated/ExchangeV2/ExchangeV2"
import { MatchOrdersCall, DirectAcceptBidCall, FillOrder, CancelOrder } from "../../generated/ORDERExchangeV2/Order";
// import { initDeal } from '../factory'
// import { calculatePriceAndFee } from '../utils'
import { ContractAddress, ContractName, DealType } from "../enum"
import { Address } from "@graphprotocol/graph-ts/index"
import { fetchOrCreateAccount, fetchOrCreateERC721Tokens, generateCombineKey, updateBlockEntity, updateOwnedTokenCount, updateTotalTransactionCollection, updateTotalVolume, updateTotalVolumeMarket } from "../utils";
import { ERC1155Balance, Order, OrderTransfer} from "../../generated/schema";

export function handleFillOrder(event : FillOrder ): void {
    let id = generateCombineKey([event.params.sig.toHexString(), event.params.index.toString(), event.params.randomValue.toString()]);
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
        order.takeQty = event.params.takeQty;
        order.filledQty = event.params.currentFilledValue;
        order.timestamp = event.block.timestamp;
        order.nonce = event.params.randomValue;
    }
    order.save();
}

export function handleCancleOrder(event: CancelOrder): void {
    let id = generateCombineKey([event.params.sig.toHexString(), event.params.index.toString(), BigInt.fromI32(0).toString()]);
    let order = Order.load(id);
    if(!order){
        order = new Order(id);
        order.maker = fetchOrCreateAccount(event.params.maker).id;
        order.sig = event.params.sig.toHexString();
        order.taker = null;
        order.index = event.params.index;
        order.status = 'CANCELED';
        order.timestamp = event.block.timestamp;
        order.takeQty = BigInt.fromI32(0);
        order.filledQty = BigInt.fromI32(0);
        order.nonce = BigInt.fromI32(0);
    }
    order.save();
}


export function handleTransferOrder(from: Address, to:Address, tokenId: string, contract: Address, timestamp: BigInt, type: String, value: BigInt): void{
    if(from === Address.fromString(ContractAddress.ZERO)){
        return;
    }

    let id = generateCombineKey([from.toHexString(), to.toHexString(), tokenId, contract.toHexString(), timestamp.toString(), 'Transfer']);
    let orderTransfer = OrderTransfer.load(id);
    if(!orderTransfer){
        orderTransfer = new OrderTransfer(id);
        orderTransfer.maker = fetchOrCreateAccount(from).id;
        orderTransfer.taker = fetchOrCreateAccount(to).id;
        orderTransfer.status = 'TRANSFER';
        orderTransfer.timestamp = timestamp;
        orderTransfer.takeQty = value;
        orderTransfer.collection = contract.toHexString();
        orderTransfer.tokenId = tokenId;
    }
    orderTransfer.save();
}