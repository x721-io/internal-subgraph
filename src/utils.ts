import { AccountCollectionOwnership, Block, Contract, ERC1155Contract, ERC1155Token, ERC721Contract, ERC721Token, MarketVolume, OnSaleStatus1155, OwnedTokenCount, OwnerContract } from "../generated/schema"
import { Account, ERC1155Balance } from "../generated/schema"
import { Address, BigInt, ethereum, log, store } from "@graphprotocol/graph-ts/index"
import { ContractAddress, ContractName } from './enum'
import { ERC721Proxy, ERC1155Proxy } from "../generated/templates";

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
export function fetchOrCreateERC721Contract(contractAddress: string, txHash: string): ERC721Contract {
    let contract = ERC721Contract.load(contractAddress)
    if (contract == null) {
        // contract = new ERC721Contract(contractAddress)
      contract = new ERC721Contract(contractAddress);
      contract.name = null;
      contract.symbol = null;
      contract.txCreation = txHash
      contract.count = BigInt.fromI32(0);
      contract.volume = BigInt.fromI32(0);
      contract.asAccount = ContractAddress.ZERO
      contract.holderCount = BigInt.fromI32(0);
      contract.transactionCount=  BigInt.fromI32(0);
      contract.createAt = BigInt.fromI32(0);
      contract.save()
      ERC721Proxy.create(Address.fromString(contractAddress))
    }
    return contract
}
export function fetchOrCreateERC721Tokens(contractAddress: string, tokenId: string, txHash: string, owner: string): ERC721Token {
    let id = generateCombineKey([contractAddress, tokenId]);
    log.warning('generated id: {}',[id])
    let token = ERC721Token.load(id);
    if (token == null) {
        let account = fetchOrCreateAccount(Address.fromString(owner))
        token = new ERC721Token(id);
        token.contract = fetchOrCreateERC721Contract(contractAddress, txHash).id
        token.tokenId = tokenId
        token.identifier = BigInt.fromString(tokenId);
        token.owner = account.id
        token.txCreation = txHash
        let zeroAccount = fetchOrCreateAccount(Address.fromString(ContractAddress.ZERO));
        token.createAt = BigInt.fromI32(0);
        updateContractCount(contractAddress, BigInt.fromI32(1), 'ERC721');    
        token.approval = zeroAccount.id;
        token.uri = ""; // Set the URI based on your logic
        token.save();
    }
    return token;
}
// export function fetchOrCreateERC1155Tokens(contractAddress: string, tokenId: string): ERC1155Token {
//     let id = generateCombineKey([contractAddress, tokenId]);
//     let token = ERC1155Token.load(id);
//     if (token == null) {
//         token = new ERC1155Token(id);
//     }
//     return token;
// }
export function fetchOrCreateERC1155Contract(contractAddress: string, txHash: string): ERC1155Contract {
  let contract = ERC1155Contract.load(contractAddress)
  if (contract == null) {
      // contract = new ERC721Contract(contractAddress)
    contract = new ERC1155Contract(contractAddress);
    contract.name = null;
    contract.symbol = null;
    contract.txCreation = txHash
    contract.count = BigInt.fromI32(0);
    contract.volume = BigInt.fromI32(0);
    contract.asAccount = ContractAddress.ZERO
    contract.holderCount = BigInt.fromI32(0);
    contract.transactionCount=  BigInt.fromI32(0);
    contract.createAt = BigInt.fromI32(0);
    contract.save()
    ERC1155Proxy.create(Address.fromString(contractAddress))
  }
  return contract
}

export function fetchOrCreateERC1155Tokens(contractAddress: string, tokenId: string, txHash: string, owner: string ): ERC1155Token {
  let id = generateCombineKey([contractAddress, tokenId]);
  let token = ERC1155Token.load(id);
  if (token == null) {
    token = new ERC1155Token(id);
    token.contract = fetchOrCreateERC1155Contract(contractAddress, txHash).id
    token.tokenId = tokenId;
    token.identifier = BigInt.fromString(tokenId);
    token.txCreation = txHash
    token.createAt = BigInt.fromI32(0);
    updateContractCount(contractAddress, BigInt.fromI32(1), 'ERC1155');
    let balanceId = generateCombineKey([contractAddress, tokenId])
    let totalSupply = new ERC1155Balance(balanceId);
    totalSupply.value = BigInt.fromI32(0).toBigDecimal();
    totalSupply.valueExact = BigInt.fromI32(0);
    totalSupply.contract = fetchOrCreateERC1155Contract(contractAddress, txHash).id;
    totalSupply.token = token.id;
    totalSupply.save();
    token.totalSupply = totalSupply.id;
    token.save();
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
    let contract721 = ERC721Contract.load(contractAddress);
    if(contract721){
        if (!wasOwner && isOwner) {
            contract721.holderCount = contract721.holderCount.plus(BigInt.fromI32(1));
        } else if (wasOwner && !isOwner) {
            contract721.holderCount = contract721.holderCount.minus(BigInt.fromI32(1));
        }
        contract721.save();
    }
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

export function updateTotalVolumeMarket(collectionAddress: Address, type: string, netPrice: BigInt ,quantity: BigInt): void {
    log.info('===============updateTotalVolumeMarket==================: {} {}, {}, {}', [collectionAddress.toHexString(), type.toString(), netPrice.toString(), quantity.toString()]);
    if (type === 'ERC721') {
        let contract = MarketVolume.load(collectionAddress.toHexString());
        if (contract) {
            let volume = netPrice.times(quantity)
            contract.totalVolume = contract.totalVolume.plus(volume);
            contract.save()
        } else {
            let newcontract = new MarketVolume(collectionAddress.toHexString());
            newcontract.totalVolume = BigInt.fromI32(0);
            newcontract.type = type;
            newcontract.save()
        }
    } else {
        let volume = netPrice.times(quantity)
        let contract = MarketVolume.load(collectionAddress.toHexString());
        if (contract) {
            contract.totalVolume = contract.totalVolume.plus(volume);
            contract.save();
        }else{
            let newcontract = new MarketVolume(collectionAddress.toHexString());
            newcontract.totalVolume = BigInt.fromI32(0);
            newcontract.type = type;
            newcontract.save()
        }
    }
}

export function updateTotalTransactionCollection(collectionAddress: string, type: string): void {
    log.info('========updateTotalTransactionCollection=======: {} {}', [collectionAddress, type.toString()]);
    if (type === 'ERC721') {
        let contract = ERC721Contract.load(collectionAddress);
        if (contract) {
            contract.transactionCount = contract.transactionCount.plus(BigInt.fromI32(1));
            contract.save()
        }
    } else {
        let contract = ERC1155Contract.load(collectionAddress);
        if (contract) {
            contract.transactionCount = contract.transactionCount.plus(BigInt.fromI32(1));
            contract.save();
        }
    }
}


export function updateOwner(user: Address, contractAddress: Address, tokenId: String, increment: boolean ,amount: BigInt , timestamp: BigInt): void {
    // ----------------------------------------------------------------------------
    // Try to load or create the Contract entity
    let contractId = contractAddress.toHexString();
    let contract = Contract.load(contractId);
  
    let ownerContractId = generateCombineKey([contractAddress.toHexString(), user.toHexString()]);
    let ownerContract = OwnerContract.load(ownerContractId);
    if (!ownerContract) {
        // If OwnerContract does not exist, create a new one with the initial count
        ownerContract = new OwnerContract(ownerContractId);
        ownerContract.user = user.toHexString();
        ownerContract.contract = contractAddress.toHexString();
        ownerContract.count = amount;
        ownerContract.timestamp = timestamp;
        ownerContract.save();
        if(!contract){
          contract = new Contract(contractId);
          contract.contract = contractId;
          contract.count = BigInt.fromI32(1);
        }else{
          contract.count = contract.count.plus(BigInt.fromI32(1));
        }
        contract.save();
        // If the Contract does not exist, create it with an initial count of 1
    } else {
      let preCount = ownerContract.count
      let currenCount = ownerContract.count.plus(amount)
      if (increment == true) {
          ownerContract.count = ownerContract.count.plus(amount);
      } else {
          ownerContract.count = ownerContract.count.minus(amount);
      }
      if (ownerContract.count <= BigInt.fromI32(0)) {
        ownerContract.count = BigInt.fromI32(0);
          
      if (!contract) {
          contract = new Contract(contractId);
          contract.contract = contractId;
          contract.count = BigInt.fromI32(1);
      } else {
          // If the contract exists, increment the count by amount
          contract.count = contract.count.minus(BigInt.fromI32(1));
          if(contract.count <= BigInt.fromI32(0)){
              contract.count = BigInt.fromI32(0);
          }
          contract.save();
      }
      }else if(preCount == BigInt.fromI32(0) || currenCount > BigInt.fromI32(0)){
        ownerContract.count = ownerContract.count.plus(amount)
      }
      ownerContract.save();
    }
  }

  export function updateOwnerv2(from: Address, to: Address ,contractAddress: Address, tokenId: String,amount: BigInt , timestamp: BigInt): void {
    // // ----------------------------------------------------------------------------
    // Try to load or create the Contract entity
    let contractId = contractAddress.toHexString();
    let contract = Contract.load(contractId);
    

    let fromID = generateCombineKey([contractAddress.toHexString(), from.toHexString()])
    let toID = generateCombineKey([contractAddress.toHexString(), to.toHexString()])
    
    if(!contract){
        contract = new Contract(contractId);
        contract.contract = contractAddress.toHexString();
        contract.count = BigInt.fromI32(1);
    }
    
    // Load the "from" owner record
    let ownerFrom = OwnerContract.load(fromID);
    if (!ownerFrom) {
      ownerFrom = new OwnerContract(fromID);
      ownerFrom.contract = contractAddress.toHexString();
      ownerFrom.count = amount.neg();
      ownerFrom.user = from.toHexString();
    } else {
      ownerFrom.count = ownerFrom.count.minus(amount);
    }

    // Load the "to" owner record
    let ownerTo = OwnerContract.load(toID);
    if (!ownerTo) {
      ownerTo = new OwnerContract(toID);
      ownerTo.contract = contractAddress.toHexString();
      ownerTo.count = amount;
      ownerTo.user = to.toHexString();
      // Increment contract count if "to" didn't exist before and addresses are valid
      if (to.toHexString() != ContractAddress.ZERO && to.toHexString() != ContractAddress.erc721marketplace && to.toHexString() != ContractAddress.erc721marketplace) {
        contract.count = contract.count.plus(BigInt.fromI32(1));
      }
      // Increment contract count as "to" didn't exist before
      contract.count = contract.count.plus(BigInt.fromI32(1));
    } else {
      let preCount = ownerTo.count;
      ownerTo.count = ownerTo.count.plus(amount);

      if(preCount == BigInt.fromI32(0) && ownerTo.count > BigInt.fromI32(0) && to.toHexString() != ContractAddress.ZERO && to.toHexString() != ContractAddress.erc721marketplace && to.toHexString() != ContractAddress.erc721marketplace ){
        contract.count = contract.count.plus(BigInt.fromI32(1));
      }
    }
    // Adjust contract count based on "from" quantity
    if (ownerFrom.count <= (BigInt.zero()) && to.toHexString() != ContractAddress.ZERO && to.toHexString() != ContractAddress.erc721marketplace && to.toHexString() != ContractAddress.erc721marketplace) {
      contract.count = contract.count.minus(BigInt.fromI32(1));
    }
    // Save changes
    ownerFrom.save();
    ownerTo.save();
    contract.save();
  }
