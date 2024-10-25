import { Block, ERC1155Token, ERC721Token } from "../generated/schema"
import { Account, ERC1155Balance, ERC721ContractState, ERC1155ContractState } from "../generated/schema"
import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts/index"
import { Coefficient } from "./enum"

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

export function updateERC721ContractState(event: ethereum.Event , contractAddress: string, countItem: BigInt , countOwner:  BigInt) : ERC721ContractState{
    let stateId = generateCombineKey([contractAddress, '- State']);
    let state = ERC721ContractState.load(stateId);
    if(state == null){
        state = new ERC721ContractState(stateId);
        state.contract = contractAddress
        state.countItem = countItem
    }else{
       state.countItem = state.countItem.plus(countItem)
    }
    state.save();
    return state
}

export function updateERC1155ContractState(event: ethereum.Event , contractAddress: string, countItem: BigInt , countOwner:  BigInt) : ERC1155ContractState{
    let stateId = generateCombineKey([contractAddress, '- State']);
    let state = ERC1155ContractState.load(stateId);
    if(state == null){
        state = new ERC1155ContractState(stateId);
        state.contract = contractAddress
        state.countItem = countItem
    }else{
       state.countItem = state.countItem.plus(countItem)
    }
    state.save();
    return state
}