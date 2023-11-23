import { BigInt, ethereum, log } from "@graphprotocol/graph-ts"
import {
  AskNew,
  AskCancel,
  Buy,
  OfferAccept,
  OfferNew,
  OfferCancel,
} from "../../generated/ERC1155Marketplace/ERC1155Marketplace"
import { ERC1155Token, MarketEvent1155 } from "../../generated/schema"
import { updateBlockEntity } from "../utils";

function createEvent(id: BigInt, action: string): MarketEvent1155 {
  return new MarketEvent1155(id.toString() + "-" + action);
}

function createEventId(id: BigInt, action: string): string {
  return id.toString() + "-" + action;
}
export function handleAskNew(event: AskNew): void {
  updateBlockEntity(event, 'handleAskNew-1155')
  let ev = createEvent(event.params.askId, 'Ask');
  const nft = ERC1155Token.load(event.params.tokenId.toString());
  log.info('nft1155: {}', [nft!.id])
  if (nft) {
    log.info('creating new event', []);
    ev.event = "AskNew";
    ev.timestamp = event.block.timestamp;
    ev.address = event.params.nft.toHexString();
    ev.txHash = event.transaction.hash.toHex();
    ev.from = event.params.seller.toHexString();
    ev.nftId = nft.id;
    ev.quoteToken = event.params.quoteToken. toHexString();
    ev.price = event.params.pricePerUnit;
    ev.amounts = event.params.quantity;
    ev.operationId = event.params.askId;
    ev.save();
  }
}

export function handleAskCancel(event: AskCancel): void {
  updateBlockEntity(event, 'handleAskCancel-1155')
  const id = createEventId(event.params.askId, 'Ask')
  let ev = MarketEvent1155.load(id);
  if (ev) {
    ev.event = 'AskCancel';
    ev.operationId = event.params.askId;
    ev.save()
  }
}

export function handleTrade(event: Buy): void {
  updateBlockEntity(event, 'handleTrade-1155')
  let id = createEventId(event.params.askId, "Ask");
  const ev = MarketEvent1155.load(id);
  if (ev) {
    ev.event = "Trade";
    ev.timestamp = event.block.timestamp;
    ev.txHash = event.transaction.hash.toHexString();
    ev.to = event.params.buyer.toHexString();
    ev.price = event.params.price;
    ev.netPrice = event.params.netPrice;
    ev.amounts = event.params.quantity;
    ev.save();
  }
}

export function handleAcceptBid(event: OfferAccept): void {
  updateBlockEntity(event, 'handleAcceptBid-1155')
  let id = createEventId(event.params.offerId, "Offer");
  const ev = MarketEvent1155.load(id);
  if (ev) {
    ev.event = "AcceptBid";
    ev.timestamp = event.block.timestamp;
    ev.txHash = event.transaction.hash.toHexString();
    ev.from = event.params.seller.toHexString();
    ev.price = event.params.price;
    ev.netPrice = event.params.netPrice;
    ev.amounts = event.params.quantity;
    ev.save();
  }
}

export function handleBid(event: OfferNew): void {
  updateBlockEntity(event, 'handleCancelBid-1155')
  let ev = createEvent(event.params.offerId, "Offer");
  const nft = ERC1155Token.load(event.params.tokenId.toString());
  if (nft) {
    ev.event = "Bid";
    ev.timestamp = event.block.timestamp;
    ev.address = event.params.nft.toHexString();
    ev.txHash = event.transaction.hash.toHexString();
    ev.to = event.params.buyer.toHexString();
    ev.nftId = nft.id;
    ev.quoteToken = event.params.quoteToken.toHexString();
    ev.price = event.params.pricePerUnit;
    ev.amounts = event.params.quantity;
    ev.save();
  }
}

export function handleCancelBid(event: OfferCancel): void {
  updateBlockEntity(event, 'handleCancelBid-1155')
  const id = createEventId(event.params.offerId, 'Offer')
  let ev = MarketEvent1155.load(id);
  if (ev) {
    ev.event = 'CancelBid';
    ev.operationId = event.params.offerId;
    ev.save()
  }
}
