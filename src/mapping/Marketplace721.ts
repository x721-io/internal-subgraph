import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import {
  AskNew,
  AskCancel,
  Trade,
  AcceptBid,
  Bid,
  CancelBid
} from "../../generated/ERC721Marketplace/ERC721Marketplace"
import { ERC721Token, MarketEvent721 } from "../../generated/schema"
import { fetchOrCreateERC721Tokens, generateCombineKey, updateBlockEntity } from "../utils";
import { ContractAddress } from "../enum";

function createEvent(contract: Address, tokenId: BigInt, bidderAddr: Address | null = null): MarketEvent721 {
  if (!bidderAddr) {
    // let ev = MarketEvent721.load(contract.toHexString() + "-" + tokenId.toString());
    let id = generateCombineKey([contract.toHexString(), tokenId.toString()])
    let ev = MarketEvent721.load(id)
    if (!ev)
      return new MarketEvent721(id);
    else  
      return ev;
  } else {
    let id = generateCombineKey([contract.toHexString(), tokenId.toString(), bidderAddr.toHexString()])
    let ev = MarketEvent721.load(id);
    if (!ev)
      return new MarketEvent721(id);
    else  
      return ev;
  }
}

export function handleAskNew(event: AskNew): void {
  let ev = createEvent(event.params._nft, event.params._tokenId);
  // const nft = ERC721Token.load(generateCombineKey([event.params._nft.toString(), event.params._tokenId.toString()]));
  const nft = fetchOrCreateERC721Tokens(event.params._nft.toHexString(), event.params._tokenId.toString());

  if (nft) {
    log.info('creating new event', []);
    ev.event = "AskNew";
    ev.timestamp = event.block.timestamp;
    ev.address = event.params._nft.toHexString();
    ev.txHash = event.transaction.hash.toHex();
    ev.from = event.params._seller.toHexString();
    ev.to = null;
    ev.nftId = nft.id;
    ev.quoteToken = event.params._quoteToken. toHexString();
    ev.price = event.params._price;
    updateBlockEntity(event, event.params._nft, event.params._tokenId, event.params._seller, Address.fromString(ContractAddress.ZERO), 'AskNew', event.params._price, BigInt.fromI32(1), event.params._quoteToken);
    ev.save();
  }
}

export function handleAskCancel(event: AskCancel): void {
  let ev = createEvent(event.params._nft, event.params._tokenId);
  const nft = fetchOrCreateERC721Tokens(event.params._nft.toHexString(), event.params._tokenId.toString());

  if (nft) {
    ev.event = "AskCancel";
    ev.timestamp = event.block.timestamp;
    ev.address = event.params._nft.toHexString();
    ev.txHash = event.transaction.hash.toHexString();
    ev.from = event.params._seller.toHexString();
    ev.nftId = nft.id;
    updateBlockEntity(event, event.params._nft, event.params._tokenId, event.params._seller, Address.fromString(ContractAddress.ZERO), 'AskCancel', BigInt.fromI32(0), BigInt.fromI32(1), Address.fromString(ev.quoteToken!));
    ev.save();
  }
}

export function handleTrade(event: Trade): void {
  let ev = createEvent(event.params._nft, event.params._tokenId);
  const nft = fetchOrCreateERC721Tokens(event.params._nft.toHexString(), event.params._tokenId.toString());

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
    ev.netPrice = event.params._netPrice;
    updateBlockEntity(event, event.params._nft, event.params._tokenId, event.params._seller, event.params.buyer, 'Trade', event.params._price, BigInt.fromI32(1), event.params._quoteToken);
    ev.save();
  }
}

export function handleAcceptBid(event: AcceptBid): void {
  let ev = createEvent(event.params._nft, event.params._tokenId, event.params.bidder);
  let evAsk = MarketEvent721.load(generateCombineKey([event.params._nft.toString(), event.params._tokenId.toString()]));
  const nft = fetchOrCreateERC721Tokens(event.params._nft.toHexString(), event.params._tokenId.toString());
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
    ev.netPrice = event.params._netPrice;
    updateBlockEntity(event, event.params._nft, event.params._tokenId, event.params._seller, event.params.bidder, 'AcceptBid', event.params._price, BigInt.fromI32(1), event.params._quoteToken);
    ev.save();
  }
  if (evAsk && evAsk.event == "AskNew") {
    evAsk.event = "AskCancel";
    evAsk.timestamp = event.block.timestamp;
    evAsk.address = event.params._nft.toHexString();
    evAsk.txHash = event.transaction.hash.toHexString();
    evAsk.save()
  }
}

export function handleBid(event: Bid): void {
  let ev = createEvent(event.params._nft, event.params._tokenId, event.params.bidder);
  const nft = fetchOrCreateERC721Tokens(event.params._nft.toHexString(), event.params._tokenId.toString());
  if (nft) {
    ev.event = "Bid";
    ev.timestamp = event.block.timestamp;
    ev.address = event.params._nft.toHexString();
    ev.txHash = event.transaction.hash.toHexString();
    ev.to = event.params.bidder.toHexString();
    ev.from = null;
    ev.nftId = nft.id;
    ev.quoteToken = event.params._quoteToken.toHexString();
    ev.price = event.params._price;
    updateBlockEntity(event, event.params._nft, event.params._tokenId, Address.fromString(ContractAddress.ZERO), event.params.bidder, 'Bid', event.params._price, BigInt.fromI32(1), event.params._quoteToken);
    ev.save();
  }
}

export function handleCancelBid(event: CancelBid): void {
  let ev = createEvent(event.params._nft, event.params._tokenId, event.params.bidder);
  const nft = fetchOrCreateERC721Tokens(event.params._nft.toHexString(), event.params._tokenId.toString());
  if (nft) {
    ev.timestamp = event.block.timestamp;
    ev.txHash = event.transaction.hash.toHexString();
    ev.address = event.params._nft.toHexString();
    ev.event = "CancelBid";
    ev.to = event.params.bidder.toHexString();
    ev.nftId = nft.id;
    updateBlockEntity(event, event.params._nft, event.params._tokenId, Address.fromString(ContractAddress.ZERO), event.params.bidder, 'CancelBid', BigInt.fromI32(0), BigInt.fromI32(1), Address.fromString(ev.quoteToken!));
    ev.save();
  }
}
