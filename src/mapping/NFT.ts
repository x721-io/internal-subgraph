import { Account, Collection, Creator, ERC1155Balance, ERC1155Token, ERC1155Transfer, ERC721Token, ERC721Transfer, Transaction } from "../../generated/schema";
import { Approval, ApprovalForAll, BaseUriChanged, CreateERC721Rarible, CreateERC721RaribleUser, Creators, DefaultApproval, ERC721Proxy, MinterStatusChanged, RoyaltiesSet, Transfer } from "../../generated/templates/ERC721Proxy/ERC721Proxy";
import { CreateERC1155Rarible, CreateERC1155RaribleUser, Supply, TransferBatch, TransferSingle, URI } from "../../generated/templates/ERC1155Proxy/ERC1155Proxy";
import { BigInt, log } from "@graphprotocol/graph-ts";
import { ensureAccount, fetchOrCreateAccount, updateERC1155Balance } from "../utils";
export function handleApproval(event: Approval): void {
    // Logic to handle the Approval event
  }
  
  export function handleApprovalForAll(event: ApprovalForAll): void {
    // Logic to handle the ApprovalForAll event
  }
  
  export function handleBaseUriChanged(event: BaseUriChanged): void {
    // Logic to handle the BaseUriChanged event
  }
  
  export function handleCreateERC721Rarible(event: CreateERC721Rarible): void {
    let collection = Collection.load(event.address.toHexString());
    if (collection !== null) {
      collection.name = event.params.name;
      collection.symbol = event.params.symbol;
      collection.type = 'ERC721';
      collection.save(); 
    }
    else {
      let newCollection = new Collection(event.address.toHexString());
      newCollection.name = event.params.name;
      newCollection.symbol = event.params.symbol;
      newCollection.owner = event.params.owner.toHexString();
      newCollection.type = 'ERC721';
      newCollection.save()
    }
  }
  
  export function handleCreateERC721RaribleUser(event: CreateERC721RaribleUser): void {
    let collection = Collection.load(event.address.toHexString());
    if (collection !== null) {
      collection.name = event.params.name;
      collection.symbol = event.params.symbol;
      collection.type = 'ERC721';
      collection.save(); 
    }
    else {
      let newCollection = new Collection(event.address.toHexString());
      newCollection.name = event.params.name;
      newCollection.symbol = event.params.symbol;
      newCollection.owner = event.params.owner.toHexString();
      newCollection.type = 'ERC721';
      newCollection.save()
    }
  }
  export function handleCreateERC1155Rarible(event: CreateERC1155Rarible): void {
    let collection = Collection.load(event.address.toHexString());
    if (collection !== null) {
      collection.name = event.params.name;
      collection.symbol = event.params.symbol;
      collection.type = 'ERC1155';
      collection.save(); 
    }
    else {
      let newCollection = new Collection(event.address.toHexString());
      newCollection.name = event.params.name;
      newCollection.symbol = event.params.symbol;
      newCollection.owner = event.params.owner.toHexString();
      newCollection.type = 'ERC1155';
      newCollection.save()
    }
  }
  
  export function handleCreateERC1155RaribleUser(event: CreateERC1155RaribleUser): void {
    let collection = Collection.load(event.address.toHexString());
    if (collection !== null) {
      collection.name = event.params.name;
      collection.symbol = event.params.symbol;
      collection.type = 'ERC1155';
      collection.save(); 
    }
    else {
      let newCollection = new Collection(event.address.toHexString());
      newCollection.name = event.params.name;
      newCollection.symbol = event.params.symbol;
      newCollection.owner = event.params.owner.toHexString();
      newCollection.type = 'ERC1155';
      newCollection.save()
    }
  }
  
  export function handleDefaultApproval(event: DefaultApproval): void {
    // Logic to handle the DefaultApproval event
  }
  
  export function handleMinterStatusChanged(event: MinterStatusChanged): void {
    // Logic to handle the MinterStatusChanged event
  }
  
  export function handleRoyaltiesSet(event: RoyaltiesSet): void {
    // Logic to handle the RoyaltiesSet event
  }
  
  export function handleTransfer(event: Transfer): void {
    const tokenId = event.params.tokenId.toString();
    let token = ERC721Token.load(tokenId);
  
    // Handle the new transaction
    let transaction = Transaction.load(event.transaction.hash.toHex());
    if (transaction == null) {
      transaction = new Transaction(event.transaction.hash.toHex());
      transaction.timestamp = event.block.timestamp;
      transaction.blockNumber = event.block.number;
      transaction.save();
    }
  
    // If the token does not exist yet, create it - this indicates a minting event
    if (token == null) {
      token = new ERC721Token(tokenId);
      token.contract = event.address.toHexString();
      token.identifier = event.params.tokenId;
      token.owner = event.params.to.toHexString();
      let zeroAccount = Account.load('0x0000000000000000000000000000000000000000');
      if (zeroAccount == null) {
        zeroAccount = new Account('0x0000000000000000000000000000000000000000');
        zeroAccount.save();
      }
      // Set the approval to the zero address when the token is minted
      token.approval = zeroAccount.id;
      token.uri = ""; // Set the URI based on your logic
      token.save();
    } else {
      // Assuming approval is cleared on transfer
      token.approval = '0x0000000000000000000000000000000000000000';
      token.owner = event.params.to.toHex(); // Update the owner
      token.save();
    }
  
    // Ensure 'to' account is created
    let accountToId = event.params.to.toHex();
    let accountTo = Account.load(accountToId);
    if (accountTo == null) {
      accountTo = new Account(accountToId);
      accountTo.save();
    }
  
    // Create the transfer event entity
    let transfer = new ERC721Transfer(event.transaction.hash.toHex() + "-" + tokenId);
    transfer.transaction = transaction.id;
    transfer.contract = event.address.toHex();
    transfer.token = tokenId;
    transfer.to = accountTo.id;
    transfer.from = event.params.from.toHex();
    transfer.timestamp = event.block.timestamp;
    transfer.emitter = event.params.from.toHex();
    transfer.save();
  
    // Ensure 'from' account is created
    if (event.params.from.toHex() != "0x0000000000000000000000000000000000000000") {
      let accountFromId = event.params.from.toHex();
      let accountFrom = Account.load(accountFromId);
      if (accountFrom == null) {
        accountFrom = new Account(accountFromId);
        accountFrom.save();
      }
    }
  }
  
  export function handleTransferSingle(event: TransferSingle): void {
    let transaction = Transaction.load(event.transaction.hash.toHex());
    if (transaction == null) {
      transaction = new Transaction(event.transaction.hash.toHex());
      transaction.timestamp = event.block.timestamp;
      transaction.blockNumber = event.block.number;
      transaction.save();
    }

    let tokenId = event.params.id.toString();
    log.info('second token: {}', [tokenId])
    let token = ERC1155Token.load(tokenId);
    log.info('final token: {}', [(token == null).toString()])
    if (token == null) {
      token = new ERC1155Token(tokenId);
      // Initialize other ERC1155Token properties here
      token.save();
    }

    // Update balances for 'from' and 'to' accounts
    updateERC1155Balance(event.params.from, tokenId, event.params.value.times(BigInt.fromI32(-1)), event.address.toHex()); // Subtract value
    updateERC1155Balance(event.params.to, tokenId, event.params.value, event.address.toHex()); // Add value

    // Create ERC1155Transfer entity
    let transfer = new ERC1155Transfer(event.transaction.hash.toHex() + "-" + tokenId);
    transfer.transaction = transaction.id;
    transfer.token = token.id;
    transfer.from = fetchOrCreateAccount(event.params.from).id;
    transfer.to = fetchOrCreateAccount(event.params.to).id;
    transfer.value = event.params.value.toBigDecimal();
    transfer.valueExact = event.params.value;
    transfer.timestamp = event.block.timestamp;
    transfer.contract = event.address.toHex();
    // Set the emitter if available or use operator
    transfer.emitter = fetchOrCreateAccount(event.params.operator).id;
    transfer.save();
  }

  export function handleTranferBatch(event: TransferBatch): void {
    let transaction = Transaction.load(event.transaction.hash.toHex());
    if (transaction == null) {
      transaction = new Transaction(event.transaction.hash.toHex());
      transaction.timestamp = event.block.timestamp;
      transaction.blockNumber = event.block.number;
      transaction.save();
    }
    for (let i = 0; i < event.params.ids.length; i++) {
      let tokenId = event.params.ids[i].toString();
      let token = ERC1155Token.load(tokenId);
      if (token == null) {
        token = new ERC1155Token(tokenId);
        // Initialize other ERC1155Token properties here
        token.save();
      }

      // Update balances for 'from' and 'to' accounts
      updateERC1155Balance(event.params.from, tokenId, event.params.values[i].times(BigInt.fromI32(-1)), event.address.toHex()); // Subtract value
      updateERC1155Balance(event.params.to, tokenId, event.params.values[i], event.address.toHex()); // Add value

      // Create ERC1155Transfer entity
      let transfer = new ERC1155Transfer(event.transaction.hash.toHex() + "-" + tokenId);
      transfer.transaction = transaction.id;
      transfer.token = token.id;
      transfer.from = fetchOrCreateAccount(event.params.from).id;
      transfer.to = fetchOrCreateAccount(event.params.to).id;
      transfer.value = event.params.values[i].toBigDecimal();
      transfer.timestamp = event.block.timestamp;
      // Set the emitter if available or use operator
      transfer.emitter = fetchOrCreateAccount(event.params.operator).id;
      transfer.save();
    }
  }
  export function handleSupply(event: Supply): void {
    let token = ERC1155Token.load(event.params.tokenId.toString());
    if (token === null) {
      log.info('first token: {}', [event.params.tokenId.toString()])
      token = new ERC1155Token(event.params.tokenId.toString());
      token.identifier = event.params.tokenId;
      token.contract = event.address.toHexString();
      // Assume we create a balance entity for totalSupply
      let totalSupply = new ERC1155Balance(event.address.toHex() + "-" + event.params.tokenId.toString());
      totalSupply.value = event.params.value.toBigDecimal();
      totalSupply.valueExact = event.params.value;
      totalSupply.contract = event.address.toHex();
      totalSupply.token = token.id;
      totalSupply.save();
  
      token.totalSupply = totalSupply.id;
      log.info('supply: {}', [totalSupply.id])
      token.save();
      log.info('token created: {}', [token.id.toString()])
    }
  }

  export function handleCreators(event: Creators): void {
    let tokenId = event.params.tokenId.toString();
    let token = ERC1155Token.load(tokenId);

    // Assuming event.params.creators is an array of addresses
    for (let i = 0; i < event.params.creators.length; i++) {
      let creatorAddress = event.params.creators[i];
      let creatorId = tokenId + "-" + creatorAddress.account.toString();
      
      let creatorEntity = new Creator(creatorId);
      creatorEntity.account = creatorAddress.account.toHex()
      creatorEntity.share = BigInt.fromI32(1); // Placeholder, use actual logic to determine share
      creatorEntity.save();
    }
  }

  export function handleURI(event: URI): void {
    let token = ERC1155Token.load(event.params.id.toString());
    if (token) {
      token.uri = event.params.value.toString();
      token.save();
    }
  }