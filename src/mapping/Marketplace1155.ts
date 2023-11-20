import { BigInt, ethereum, log } from "@graphprotocol/graph-ts"
import {
  AskNew,
  AskCancel,
  Trade,
  AcceptBid,
  Bid,
  CancelBid
} from "../../generated/ERC1155Marketplace/ERC1155Marketplace"
import { ERC1155Token, MarketEvent1155 } from "../../generated/schema"

function createEvent(event: ethereum.Event): MarketEvent1155 {
  return new MarketEvent1155(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
}

export function handleAskNew(event: AskNew): void {
  log.info("ask new: {}", [event.params._tokenId.toString()])
  let ev = createEvent(event);
  const nft = ERC1155Token.load(event.params._tokenId.toString());
  log.info('nft1155: {}', [nft!.id])
  if (nft) {
    log.info('creating new event', []);
    ev.event = "AskNew";
    ev.timestamp = event.block.timestamp;
    ev.address = event.params._nft.toHexString();
    ev.txHash = event.transaction.hash.toHex();
    ev.from = event.params._seller.toHexString();
    ev.nftId = nft.id;
    ev.quoteToken = event.params._quoteToken. toHexString();
    ev.price = event.params._price;
    ev.amounts = event.params._amounts;
    ev.save();
  }
}

export function handleAskCancel(event: AskCancel): void {
  let ev = createEvent(event);
  const nft = ERC1155Token.load(event.params._tokenId.toString());
  if (nft) {
    ev.event = "AskCancel";
    ev.timestamp = event.block.timestamp;
    ev.address = event.params._nft.toHexString();
    ev.txHash = event.transaction.hash.toHexString();
    ev.from = event.params._seller.toHexString();
    ev.nftId = nft.id;
    ev.amounts = event.params._amounts;
    ev.save();
  }
}

export function handleTrade(event: Trade): void {
  let ev = createEvent(event);
  const nft = ERC1155Token.load(event.params._tokenId.toString());
  if (nft) {
    ev.event = "Trade";
    ev.timestamp = event.block.timestamp;
    ev.address = event.params._nft.toHexString();
    ev.txHash = event.transaction.hash.toHexString();
    ev.from = event.params._seller.toHexString();
    ev.to = event.params.buyer.toHexString();
    ev.nftId = nft.id;
    ev.quoteToken = event.params._quoteToken.toHexString();
    ev.price = event.params._price;
    ev.netPrice = event.params._netPay;
    ev.amounts = event.params._amounts;
    ev.save();
  }
}

export function handleAcceptBid(event: AcceptBid): void {
  let ev = createEvent(event);
  const nft = ERC1155Token.load(event.params._tokenId.toString());
  if (nft) {
    ev.txHash = event.transaction.hash.toHexString();
    ev.timestamp = event.block.timestamp;
    ev.address = event.params._nft.toHexString();
    ev.event = "AcceptBid";
    ev.from = event.params._seller.toHexString();
    ev.to = event.params.bidder.toHexString();
    ev.nftId = nft.id;
    ev.quoteToken = event.params._quoteToken.toHexString();
    ev.price = event.params._price;
    ev.netPrice = event.params._netPay;
    ev.amounts = event.params._amounts;
    ev.save();
  }
}

export function handleBid(event: Bid): void {
  let ev = createEvent(event);
  const nft = ERC1155Token.load(event.params._tokenId.toString());
  if (nft) {
    ev.event = "Bid";
    ev.timestamp = event.block.timestamp;
    ev.address = event.params._nft.toHexString();
    ev.txHash = event.transaction.hash.toHexString();
    ev.to = event.params.bidder.toHexString();
    ev.nftId = nft.id;
    ev.quoteToken = event.params._quoteToken.toHexString();
    ev.price = event.params._price;
    ev.amounts = event.params._amounts;
    ev.save();
  }
}

export function handleCancelBid(event: CancelBid): void {
  let ev = createEvent(event);
  const nft = ERC1155Token.load(event.params._tokenId.toString());
  if (nft) {
    ev.timestamp = event.block.timestamp;
    ev.txHash = event.transaction.hash.toHexString();
    ev.address = event.params._nft.toHexString();
    ev.event = "CancelBid";
    ev.to = event.params.bidder.toHexString();
    ev.nftId = nft.id;
    ev.amounts = event.params._amounts;
    ev.save();
  }
}
