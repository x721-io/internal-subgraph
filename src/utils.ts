import { Block, ERC1155Contract, ERC1155Token, ERC721Contract, ERC721Token, OwnedTokenCount } from "../generated/schema"
import { Account, ERC1155Balance } from "../generated/schema"
import { Address, BigDecimal, BigInt, ethereum, log, store } from "@graphprotocol/graph-ts/index"
import { Coefficient, ContractAddress } from "./enum"
import { Transfer } from "../generated/templates/ERC721Proxy/ERC721Proxy"
import { TransferSingle } from "../generated/templates/ERC1155Proxy/ERC1155Proxy"

// export function calculatePriceAndFee(deal: Deal): void {
//     deal.price = calculatePrice(deal.buyAmount, deal.sellAmount)
//     deal.fee = calculateFee(deal.buyAmount)
// }

function calculatePrice(buyAmount: BigInt, sellAmount: BigInt): BigInt {
    if (buyAmount == BigInt.fromI32(0) || sellAmount == BigInt.fromI32(0)){
        return BigInt.fromI32(0)
    }
    return buyAmount.div(sellAmount)
}

function calculateFee(buyAmount: BigInt): BigDecimal {
    if (buyAmount == BigInt.fromI32(0)){
        BigDecimal.fromString("0")
    }
    return buyAmount.toBigDecimal().times(BigDecimal.fromString(Coefficient.FEE))
}
export function ensureAccount(address: Address): Account {
    let accountId = address.toHex();
    let account = Account.load(accountId);
    if (account === null) {
      account = new Account(accountId);
      account.save();
    }
    return account as Account;
  }
export function fetchOrCreateAccount(address: Address): Account {
    let accountId = address.toHex();
    let account = Account.load(accountId);
    if (account == null) {
        account = new Account(accountId);
        account.save();
    }
    return account as Account;
}

export function generateCombineKey(keys: string[]): string {
    
    return keys.join('-');
}
export function fetchOrCreateERC721Tokens(contractAddress: string, tokenId: string): ERC721Token {
    let id = generateCombineKey([contractAddress, tokenId]);
    log.warning('generated id: {}',[id])
    let token = ERC721Token.load(id);
    if (token == null) {
        token = new ERC721Token(id);
    }
    return token;
}
export function fetchOrCreateERC1155Tokens(contractAddress: string, tokenId: string): ERC1155Token {
    let id = generateCombineKey([contractAddress, tokenId]);
    log.warning('generated id: {}',[id])

    let token = ERC1155Token.load(id);
    if (token == null) {
        token = new ERC1155Token(id);
    }
    return token;
}
export function updateERC1155Balance(accountAddress: Address, tokenId: string, value: BigInt, contractAddress: string): ERC1155Balance {
    // let balanceId = accountAddress.toHex() + "-" + tokenId;
    let balanceId = generateCombineKey([accountAddress.toHex(), tokenId])
    let balance = ERC1155Balance.load(balanceId);
    if (balance == null) {
        balance = new ERC1155Balance(balanceId);
        balance.value = value.toBigDecimal();
        balance.valueExact = value;
        balance.token = tokenId;
        balance.contract = contractAddress;
        balance.account = fetchOrCreateAccount(accountAddress).id;
    } else {
        balance.value = balance.value.plus(value.toBigDecimal());
        balance.valueExact = balance.valueExact.plus(value);
    }
    balance.save();
    return balance
}

export function updateContractCount(id: string, quantity: BigInt, type: string): void {
    if (type === 'ERC721') {
        let contract = ERC721Contract.load(id);
        if (contract) {
            contract.count = contract.count.plus(quantity);
            contract.save()
        }
    } else {
        let contract = ERC1155Contract.load(id);
        if (contract) {
            contract.count = contract.count.plus(quantity);
            contract.save();
        }
    }
}

export function updateOwnedTokenCount(accountId: string, contractAddress: string, increment: boolean, timestamp: BigInt): void {
    let ownedTokenCountId = accountId + '-' + contractAddress;
    let ownedTokenCount = OwnedTokenCount.load(ownedTokenCountId);
    log.info('Alo: {}', [accountId])

    if (ownedTokenCount == null) {
        ownedTokenCount = new OwnedTokenCount(ownedTokenCountId);
        ownedTokenCount.owner = accountId;
        ownedTokenCount.contract = contractAddress;
        ownedTokenCount.count = BigInt.fromI32(0);
    }

    if (increment) {
        ownedTokenCount.count = ownedTokenCount.count.plus(BigInt.fromI32(1));
    } else {
        ownedTokenCount.count = ownedTokenCount.count.minus(BigInt.fromI32(1));
    }
    ownedTokenCount.timestamp = timestamp
    ownedTokenCount.save();
}



export function updateBlockEntity(event: ethereum.Event, contract: Address, tokenId: BigInt, from: Address, to: Address, type: string, price: BigInt, quantity: BigInt, quoteToken: Address): void {
  let block = Block.load(`${event.transaction.hash.toHexString()}-${tokenId.toString()}`)
  if (block) {
      block.timestampt = event.block.timestamp.toI32()
      block.blockNumber = event.block.number.toI32()
      if (type === 'AcceptBid')
        block.event = type
      block.from = from.toHexString();
      block.to = to.toHexString();
    //   block.quantity = quantity;
    //   block.price = price;
    //   block.address = contract.toHexString()
    //   block.tokenId = tokenId;
      block.save()
  } else {
    let block = new Block(`${event.transaction.hash.toHexString()}-${tokenId.toString()}`)
    block.timestampt = event.block.timestamp.toI32()
    block.blockNumber = event.block.number.toI32()
    block.event = type
    block.from = from.toHexString();
    block.to = to.toHexString();
    block.quantity = quantity;
    block.price = price;
    block.address = contract.toHexString()
    block.tokenId = tokenId;
    block.quoteToken = quoteToken.toHexString();
    block.save()
  }
}