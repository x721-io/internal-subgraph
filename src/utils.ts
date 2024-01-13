import { AccountCollectionOwnership, Block, ERC1155Contract, ERC1155Token, ERC721Contract, ERC721Token, OwnedTokenCount } from "../generated/schema"
import { Account, ERC1155Balance } from "../generated/schema"
import { Address, BigDecimal, BigInt, ethereum, log, store } from "@graphprotocol/graph-ts/index"
import { Coefficient, ContractAddress } from "./enum"
import { Transfer } from "../generated/templates/ERC721Proxy/ERC721Proxy"
import { TransferSingle } from "../generated/templates/ERC1155Proxy/ERC1155Proxy"
import { NFT as erc721Contract} from '../generated/NFT/NFT'
import {ERC721LegacyFactory as factoryContract } from "../generated/ERC721FactoryLegacy/ERC721LegacyFactory"
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
    let balanceId = generateCombineKey([accountAddress.toHex(), tokenId]);
    let balance = ERC1155Balance.load(balanceId);

    let ownershipId = accountAddress.toHex() + '-' + contractAddress;
    let accountCollectionOwnership = AccountCollectionOwnership.load(ownershipId);
    let previouslyOwned = accountCollectionOwnership != null && accountCollectionOwnership.ownsTokens;


    // Check for previous 
    log.warning('here: {}', [contractAddress])
    // let previouslyOwned = balance != null && balance.valueExact.gt(BigInt.fromI32(0));
    // log.warning('is prev owned: {}', [previouslyOwned.toString()])
    if (balance == null) {
        balance = new ERC1155Balance(balanceId);
        balance.value = value.toBigDecimal();
        balance.valueExact = value;
        balance.token = tokenId;
        balance.contract = contractAddress;
        balance.account = fetchOrCreateAccount(accountAddress).id;
    } else {
        // log.warning('previous owned: {} {}', [previouslyOwned.toString(), balance.valueExact.toString()])
        balance.value = balance.value.plus(value.toBigDecimal());
        balance.valueExact = balance.valueExact.plus(value);
    }
    balance.save();

    let nowOwned = balance.valueExact.gt(BigInt.fromI32(0));

    log.warning('value1: {}', [balance.valueExact.toString()])
    if (accountCollectionOwnership == null) {
        accountCollectionOwnership = new AccountCollectionOwnership(ownershipId);
        accountCollectionOwnership.account = accountAddress.toHexString();
        accountCollectionOwnership.contract = contractAddress;
        accountCollectionOwnership.ownsTokens = value.gt(BigInt.fromI32(0));
    } else {
        accountCollectionOwnership.ownsTokens = balance.valueExact.gt(BigInt.fromI32(0));
    }

    accountCollectionOwnership.save();

    // Update holderCount if necessary
    let contract = ERC1155Contract.load(contractAddress);
    if (contract != null) {
        // let previouslyOwned = accountCollectionOwnership.ownsTokens;
        log.warning('alo: {} {}', [accountCollectionOwnership.ownsTokens.toString(), nowOwned.toString()]);
        if (!previouslyOwned && nowOwned) {
            contract.holderCount = contract.holderCount.plus(BigInt.fromI32(1));
        } else if (previouslyOwned && !nowOwned) {
            contract.holderCount = contract.holderCount.minus(BigInt.fromI32(1));
        }
        contract.save();
    }

    return balance;
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

    if (ownedTokenCount == null) {
        ownedTokenCount = new OwnedTokenCount(ownedTokenCountId);
        ownedTokenCount.owner = accountId;
        ownedTokenCount.contract = contractAddress;
        ownedTokenCount.count = BigInt.fromI32(0);
    }

    let wasOwner = ownedTokenCount.count.gt(BigInt.fromI32(0));

    if (increment) {
        ownedTokenCount.count = ownedTokenCount.count.plus(BigInt.fromI32(1));
    } else {
        ownedTokenCount.count = ownedTokenCount.count.minus(BigInt.fromI32(1));
    }

    let isOwner = ownedTokenCount.count.gt(BigInt.fromI32(0));

    // if (isERC721) {
    let contract721 = ERC721Contract.load(contractAddress)!;
    if (!wasOwner && isOwner) {
        contract721.holderCount = contract721.holderCount.plus(BigInt.fromI32(1));
    } else if (wasOwner && !isOwner) {
        contract721.holderCount = contract721.holderCount.minus(BigInt.fromI32(1));
    }
    contract721.save();
    ownedTokenCount.timestamp = timestamp
    ownedTokenCount.save();
}



export function updateBlockEntity(event: ethereum.Event, contract: Address, tokenId: BigInt, from: Address, to: Address, type: string, price: BigInt, quantity: BigInt, quoteToken: Address): void {
  let block = Block.load(`${event.transaction.hash.toHexString()}-${tokenId.toString()}`)
  if (block) {
      block.timestampt = event.block.timestamp.toI32()
      block.blockNumber = event.block.number.toI32()
      if (type === 'AcceptBid') {
        block.event = type
        block.price = price
        block.quoteToken = quoteToken.toHexString()
      }
      block.from = from.toHexString();
      block.to = to.toHexString();
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

export function initializeNFTCollectionState(proxyAddress: Address, limit: BigInt): void {
    log.warning('limit: {} {}', [limit.toString(), proxyAddress.toHexString()])
    const contract = erc721Contract.bind(proxyAddress)
    for (let i = 1; i <= limit.toI32(); i++) {
        const owner = contract.ownerOf(BigInt.fromI32(i));
        let tokenId = generateCombineKey([proxyAddress.toHexString(), i.toString()]);
        let token = ERC721Token.load(tokenId);
        if (token == null) {
            token = new ERC721Token(tokenId);
            token.tokenId = i.toString();
            token.contract = proxyAddress.toHexString();
            token.identifier = BigInt.fromI32(i);
            token.owner = owner.toHexString();
            token.txCreation = ContractAddress.ZERO
            let zeroAccount = Account.load('0x0000000000000000000000000000000000000000');
            // updateBlockEntity(event, event.address, BigInt.fromI32(i), Address.fromString(ContractAddress.ZERO), owner, 'Mint', BigInt.fromI32(0), BigInt.fromI32(1), Address.fromString(ContractAddress.ZERO));
            // updateContractCount(event.address.toHexString(), BigInt.fromI32(1), 'ERC721');    
            if (zeroAccount == null) {
              zeroAccount = new Account('0x0000000000000000000000000000000000000000');
              zeroAccount.save();
            }
            // Set the approval to the zero address when the token is minted
            token.approval = zeroAccount.id;
            token.uri = ""; // Set the URI based on your logic
            token.save();
          }
    }
}