import { AccountCollectionOwnership, Block, ERC1155Contract, ERC1155Token, ERC721Contract, ERC721Token, OnSaleStatus1155, OwnedTokenCount } from "../generated/schema"
import { Account, ERC1155Balance } from "../generated/schema"
import { Address, BigInt, ethereum, log, store } from "@graphprotocol/graph-ts/index"
import { ContractName } from './enum'

export function fetchOrCreateAccount(address: Address): Account {
    let accountId = address.toHex();
    let account = Account.load(accountId);
    if (account == null) {
        account = new Account(accountId);
        account.onSaleCount = BigInt.fromI32(0);
        account.holdingCount = BigInt.fromI32(0);
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

    let token = ERC1155Token.load(id);
    if (token == null) {
        token = new ERC1155Token(id);
    }
    return token;
}

export function updateSaleStatus1155(accountAddress: Address, collection: Address, tokenId: BigInt, status: boolean): boolean {
    let ownershipId = generateCombineKey([accountAddress.toHexString(), collection.toHexString(), tokenId.toString()]);
    const account = fetchOrCreateAccount(accountAddress);
    let saleCount = OnSaleStatus1155.load(ownershipId);
    if (saleCount == null) {
        saleCount = new OnSaleStatus1155(ownershipId);
        saleCount.contract = collection.toHexString();
        saleCount.tokenId = tokenId;
        saleCount.owner = account.id;
        saleCount.isOnSale = status;
        saleCount.save()
        return false;
    } else {
        if (saleCount.isOnSale == true) {
            saleCount.isOnSale = status;
            saleCount.save()
            return true;
        } else {
            saleCount.isOnSale = status;
            saleCount.save()
            return false;
        }
    }
}
export function updateOnSaleCount1155(accountAddress: Address, collection: Address, tokenId: BigInt, status: boolean): void {
    if (status == true) {
        let isOnSaleBefore = updateSaleStatus1155(accountAddress, collection, tokenId, true);
        let account = fetchOrCreateAccount(accountAddress);
        if (!isOnSaleBefore) {
            account.onSaleCount = account.onSaleCount.plus(BigInt.fromI32(1));
            account.save()
        }
    } else {
        let isOnSaleBefore = updateSaleStatus1155(accountAddress, collection, tokenId, false);
        let account = fetchOrCreateAccount(accountAddress);
        if (isOnSaleBefore) {
            account.onSaleCount = account.onSaleCount.minus(BigInt.fromI32(1));
            account.save()
        }
    }
}
export function updateERC1155Balance(accountAddress: Address, tokenId: string, value: BigInt, contractAddress: string): ERC1155Balance {
    // let balanceId = accountAddress.toHex() + "-" + tokenId;
    let balanceId = generateCombineKey([accountAddress.toHex(), tokenId]);
    let balance = ERC1155Balance.load(balanceId);

    let ownershipId = accountAddress.toHex() + '-' + contractAddress;
    let accountCollectionOwnership = AccountCollectionOwnership.load(ownershipId);
    let previouslyOwned = accountCollectionOwnership != null && accountCollectionOwnership.ownsTokens;

    let owner = fetchOrCreateAccount(accountAddress);
    // Check for previous 
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

    let nowOwned = balance.valueExact.gt(BigInt.fromI32(0));

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
            owner.holdingCount = owner.holdingCount.plus(BigInt.fromI32(1));
        } else if (previouslyOwned && !nowOwned) {
            contract.holderCount = contract.holderCount.minus(BigInt.fromI32(1));
            owner.holdingCount = owner.holdingCount.minus(BigInt.fromI32(1));
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
    let owner = fetchOrCreateAccount(Address.fromString(accountId));
    if (increment) {
        ownedTokenCount.count = ownedTokenCount.count.plus(BigInt.fromI32(1));
        owner.holdingCount = owner.holdingCount.plus(BigInt.fromI32(1));
    } else {
        ownedTokenCount.count = ownedTokenCount.count.minus(BigInt.fromI32(1));
        owner.holdingCount = owner.holdingCount.minus(BigInt.fromI32(1));
    }
    owner.save();
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

export function updateTotalVolume(collectionAddress: Address, type: string, quantity: BigInt): void {
    if (type === 'ERC721') {
        let contract = ERC721Contract.load(collectionAddress.toHexString());
        if (contract) {
            contract.volume = contract.volume.plus(quantity);
            contract.save()
        }
    } else {
        let contract = ERC1155Contract.load(collectionAddress.toHexString());
        if (contract) {
            contract.volume = contract.volume.plus(quantity);
            contract.save();
        }
    }
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