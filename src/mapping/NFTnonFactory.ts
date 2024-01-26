import { ERC1155Balance, ERC1155Contract, ERC1155Token, ERC1155Transfer, ERC721Contract, ERC721Token, ERC721Transfer, Transaction } from "../../generated/schema";
import { Transfer } from "../../generated/templates/ERC721Proxy/ERC721Proxy";
import { TransferSingle, TransferBatch , ApprovalForAll , BaseUriChanged , CreateERC1155Rarible , CreateERC1155RaribleUser , Creators , DefaultApproval , MinterStatusChanged , RoyaltiesSet , Supply , URI } from "../../generated/templates/ERC1155Proxy/ERC1155Proxy";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { fetchOrCreateAccount, generateCombineKey, updateBlockEntity, updateERC1155Balance, updateContractCount, updateOwnedTokenCount } from "../utils";
import { ContractAddress } from "../enum";
export function handleTransfer(event: Transfer): void {
  if (event.params.to.toHexString() == ContractAddress.erc721marketplace) {
    return;
  }
  let contract = ERC721Contract.load(event.address.toHex());
  if (contract !== null) {
    contract.name = null;
    contract.symbol = null;
    contract.save();
  }
  else {
    let contract = new ERC721Contract(event.address.toHex());
    contract.name = null;
    contract.symbol = null;
    contract.txCreation = "";
    contract.count = BigInt.fromI32(0);
    contract.asAccount = fetchOrCreateAccount(event.params.to).id;
    contract.holderCount = BigInt.fromI32(0);
    contract.createAt = event.block.timestamp;
    contract.save()
  }
  if (event.params.from != Address.fromString(ContractAddress.ZERO) && event.params.to != Address.fromString(ContractAddress.erc721marketplace)) {
    updateOwnedTokenCount(event.params.from.toHexString(), event.address.toHexString(), false, event.block.timestamp)
  }
  if (event.params.to != Address.fromString(ContractAddress.ZERO) && event.params.from != Address.fromString(ContractAddress.erc721marketplace)) {
    updateOwnedTokenCount(event.params.to.toHexString(), event.address.toHexString(), true, event.block.timestamp)
  }
  log.warning('transfer nè: {} {} {}', [event.address.toHexString(), event.params.from.toHexString(), event.params.to.toHexString()])
  let tokenId = generateCombineKey([event.address.toHexString(), event.params.tokenId.toString()]);
  let token = ERC721Token.load(tokenId);
  // // Handle the new transaction
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
    token.tokenId = event.params.tokenId.toString()
    token.contract = event.address.toHexString();
    token.identifier = event.params.tokenId;
    token.owner = event.params.to.toHexString();
    token.txCreation = event.transaction.hash.toHexString()
    let zeroAccount = fetchOrCreateAccount(Address.fromString(ContractAddress.ZERO));
    token.createAt = event.block.timestamp;
    updateBlockEntity(event, event.address, event.params.tokenId, event.params.from, event.params.to, 'Mint', BigInt.fromI32(0), BigInt.fromI32(1), Address.fromString(ContractAddress.ZERO));
    updateContractCount(event.address.toHexString(), BigInt.fromI32(1), 'ERC721');
    // Set the approval to the zero address when the token is minted
    token.approval = zeroAccount.id;
    token.uri = ""; // Set the URI based on your logic
    token.save();
  } else {
    // Assuming approval is cleared on transfer
    token.approval = '0x0000000000000000000000000000000000000000';
    token.owner = event.params.to.toHex(); // Update the owner
    if (event.params.from.toHexString() != ContractAddress.erc721marketplace) {
      updateBlockEntity(event, event.address, event.params.tokenId, event.params.from, event.params.to, 'Transfer', BigInt.fromI32(0), BigInt.fromI32(1), Address.fromString(ContractAddress.ZERO));
    }
    token.save();
  }

  // Ensure 'to' account is created
  let accountTo = fetchOrCreateAccount(event.params.to)

  // Create the transfer event entity
  let transferId = generateCombineKey([event.transaction.hash.toHex(), event.address.toHex(), tokenId])
  let transfer = new ERC721Transfer(transferId);
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
    let accountFrom = fetchOrCreateAccount(event.params.from);
  }
}
  export function handleTransferSingleNoFactory(event: TransferSingle): void {
    if (event.params.to.toHexString() == ContractAddress.erc1155marketplace) {
      return;
    }
    let contract = ERC1155Contract.load(event.address.toHex());
    if (contract !== null) {
      contract.name = null;
      contract.symbol = null;
      contract.save();
    }
    else {
      let contract = new ERC1155Contract(event.address.toHex());
      contract.name = null;
      contract.symbol = null;
      contract.txCreation = "";
      contract.createAt = event.block.timestamp;
      contract.count = BigInt.fromI32(0);
      contract.asAccount = fetchOrCreateAccount(event.params.to).id;
      contract.holderCount = BigInt.fromI32(0);
      contract.save()
    }
    // if (event.params.from != Address.fromString(ContractAddress.ZERO)) {
    //   updateOwnedTokenCountERC1155(event.params.from.toHexString(), event.address.toHexString(), false, event.params.value, event.block.timestamp)
    // }
    // if (event.params.to != Address.fromString(ContractAddress.ZERO) && event.params.from != Address.fromString(ContractAddress.erc1155marketplace)) {
    //   updateOwnedTokenCountERC1155(event.params.to.toHexString(), event.address.toHexString(), true, event.params.value, event.block.timestamp)
    // }
    let transaction = Transaction.load(event.transaction.hash.toHex());
    if (transaction == null) {
      transaction = new Transaction(event.transaction.hash.toHex());
      transaction.timestamp = event.block.timestamp;
      transaction.blockNumber = event.block.number;
      transaction.save();
    }

    let tokenId = generateCombineKey([event.address.toHexString(), event.params.id.toString()]);
    let token = ERC1155Token.load(tokenId);
    if (token !== null) {
      // Update existing token entity (if it exists)
      if (event.params.from.toHexString() != ContractAddress.erc1155marketplace)
        updateERC1155Balance(event.params.from, tokenId, event.params.value.times(BigInt.fromI32(-1)), event.address.toHex()); // Subtract value
      let totalSupply = updateERC1155Balance(event.params.to, tokenId, event.params.value, event.address.toHex());
      token.uri = null;  // Replace with actual data if available
      token.totalSupply = totalSupply.id;  // Replace with actual data if available
      if (event.params.from == Address.fromString(ContractAddress.ZERO)) {
        let balanceId = generateCombineKey([event.address.toHex(), event.params.id.toString()])
        let totalSupply = ERC1155Balance.load(balanceId);
        if (totalSupply) {
          totalSupply.value = totalSupply.value.plus(event.params.value.toBigDecimal());
          totalSupply.valueExact = totalSupply.valueExact.plus(event.params.value);
          totalSupply.save();
        }
      }
      token.save();
    } else {
      // Create a new ERC1155Token entity
      token = new ERC1155Token(tokenId);
      token.tokenId = event.params.id.toString();
      token.contract = event.address.toHex();
      token.identifier = event.params.id; // Replace with actual data if available
      token.uri = null;  // Replace with actual data if available
      token.txCreation = event.transaction.hash.toHexString()
      token.createAt = event.block.timestamp;
      updateBlockEntity(event, event.address, event.params.id, event.params.from, event.params.to, 'Mint', BigInt.fromI32(0), event.params.value, Address.fromString(ContractAddress.ZERO));
      updateContractCount(event.address.toHexString(), BigInt.fromI32(1), 'ERC1155');
      let balanceId = generateCombineKey([event.address.toHex(), event.params.id.toString()])
      let totalSupply = new ERC1155Balance(balanceId);
      totalSupply.value = event.params.value.toBigDecimal();
      totalSupply.valueExact = event.params.value;
      totalSupply.contract = event.address.toHex();
      totalSupply.token = token.id;
      totalSupply.save();

      token.totalSupply = totalSupply.id;
      token.save();
    }
    let transferId = generateCombineKey([event.transaction.hash.toHex(), event.address.toHex(), tokenId])
    let transfer = new ERC1155Transfer(transferId);
    transfer.transaction = transaction.id;
    transfer.token = token.id;
    transfer.from = fetchOrCreateAccount(event.params.from).id;
    transfer.to = fetchOrCreateAccount(event.params.to).id;
    transfer.value = event.params.value.toBigDecimal();
    transfer.valueExact = event.params.value;
    transfer.timestamp = event.block.timestamp;
    transfer.contract = event.address.toHex();
    // transfer.fromBalance = balance.value || balance.valueExact.toI32();
    // Set the emitter if available or use operator
    transfer.emitter = fetchOrCreateAccount(event.params.operator).id;
    if (event.params.from.toHexString() != ContractAddress.erc1155marketplace) {
      updateBlockEntity(event, event.address, event.params.id, event.params.from, event.params.to, 'Transfer', BigInt.fromI32(0), event.params.value, Address.fromString(ContractAddress.ZERO));
    }
    transfer.save();
  }
  export function handleTranferBatch(event: TransferBatch): void {
    if (event.params.to.toHexString() == ContractAddress.erc1155marketplace) {
      return;
    }
    let contract = ERC1155Contract.load(event.address.toHex());
    if (contract !== null) {
      contract.name = null;
      contract.symbol = null;
      contract.save();
    }
    else {
      let contract = new ERC1155Contract(event.address.toHex());
      contract.name = null;
      contract.symbol = null;
      contract.txCreation = "";
      contract.count = BigInt.fromI32(0);
      contract.createAt = event.block.timestamp;
      contract.asAccount = fetchOrCreateAccount(event.params.to).id;
      contract.holderCount = BigInt.fromI32(0);
      contract.save()
    }
    let transaction = Transaction.load(event.transaction.hash.toHex());
    if (transaction == null) {
      transaction = new Transaction(event.transaction.hash.toHex());
      transaction.timestamp = event.block.timestamp;
      transaction.blockNumber = event.block.number;
      transaction.save();
    }
    for (let i = 0; i < event.params.ids.length; i++) {
      // if (event.params.from != Address.fromString(ContractAddress.ZERO)) {
      //   updateOwnedTokenCountERC1155(event.params.from.toHexString(), event.address.toHexString(), false, event.params.values[i],event.block.timestamp)
      // }
      // if (event.params.to != Address.fromString(ContractAddress.ZERO) && event.params.from != Address.fromString(ContractAddress.erc1155marketplace)) {
      //   updateOwnedTokenCountERC1155(event.params.to.toHexString(), event.address.toHexString(), true, event.params.values[i],event.block.timestamp)
      // }
      let tokenId = generateCombineKey([event.address.toHexString(), event.params.ids[i].toString()]);
      let token = ERC1155Token.load(tokenId);
      if (token == null) {
        token = new ERC1155Token(tokenId);
        token.tokenId = event.params.ids[i].toString();
        token.contract = event.address.toHex();
        token.identifier = event.params.ids[i] // Replace with actual data if available
        token.uri = null;  // Replace with actual data if available
        token.txCreation = event.transaction.hash.toHexString()
        token.createAt = event.block.timestamp;
        // let totalSupply = updateERC1155Balance(event.params.to, tokenId, event.params.values[i], event.address.toHex());
        // if(totalSupply){
        //   token.totalSupply = totalSupply.id;
        // }
        let balanceId = generateCombineKey([event.address.toHex(), event.params.ids[i].toString()])
        let totalSupply = new ERC1155Balance(balanceId);
        totalSupply.value = event.params.values[i].toBigDecimal();
        totalSupply.valueExact = event.params.values[i];
        totalSupply.contract = event.address.toHex();
        totalSupply.token = token.id;
        totalSupply.save();

      token.totalSupply = totalSupply.id;
        token.save();
      }
  
      // Update balances for 'from' and 'to' accounts
      if (event.params.from.toHexString() != ContractAddress.erc1155marketplace)
        updateERC1155Balance(event.params.from, tokenId, event.params.values[i].times(BigInt.fromI32(-1)), event.address.toHex()); // Subtract value
      updateERC1155Balance(event.params.to, tokenId, event.params.values[i], event.address.toHex()); // Add value
  
      // Create ERC1155Transfer entity
      let transferId = generateCombineKey([event.transaction.hash.toHex(), event.address.toHex(), tokenId])
      let transfer = new ERC1155Transfer(transferId);
      transfer.transaction = transaction.id;
      transfer.token = token.id;
      transfer.from = fetchOrCreateAccount(event.params.from).id;
      transfer.to = fetchOrCreateAccount(event.params.to).id;
      transfer.value = event.params.values[i].toBigDecimal();
      transfer.valueExact = event.params.values[i];
      transfer.timestamp = event.block.timestamp;
      transfer.contract = event.address.toHex();
      // Set the emitter if available or use operator
      transfer.emitter = fetchOrCreateAccount(event.params.operator).id;
      if (event.params.to.toHexString() != ContractAddress.erc1155marketplace) {
        updateBlockEntity(event, event.address, event.params.ids[i], event.params.from, event.params.to, 'Transfer', BigInt.fromI32(0), event.params.values[i], Address.fromString(ContractAddress.ZERO));
      }
      transfer.save();
    }
  }
  export function handleApprovalForAll(event: ApprovalForAll): void {
    // Logic to handle the ApprovalForAll event
  }

  export function handleBaseUriChanged(event: BaseUriChanged): void {
    // Logic to handle the BaseUriChanged event
  }

  export function handleCreateERC1155Rarible(event: CreateERC1155Rarible): void {
    // let collection = ERC1155Contract.load(event.address.toHexString());
    // if (collection !== null) {
    //   collection.name = event.params.name;
    //   collection.symbol = event.params.symbol;
    //   collection.count = BigInt.fromI32(0);
    //   collection.holderCount = BigInt.fromI32(0);
    //   collection.save();
    // }
    // else {
    //   let newCollection = new ERC1155Contract(event.address.toHexString());
    //   newCollection.name = event.params.name;
    //   newCollection.symbol = event.params.symbol;
    //   newCollection.txCreation = event.transaction.hash.toHexString();
    //   newCollection.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    //   newCollection.count = BigInt.fromI32(0);
    //   newCollection.holderCount = BigInt.fromI32(0);
    //   newCollection.save()
    // }
  }

  export function handleCreateERC1155RaribleUser(event: CreateERC1155RaribleUser): void {
    // let collection = ERC1155Contract.load(event.address.toHexString());
    // if (collection !== null) {
    //   collection.name = event.params.name;
    //   collection.symbol = event.params.symbol;
    //   collection.count = BigInt.fromI32(0);
    //   collection.holderCount = BigInt.fromI32(0);
    //   collection.save();
    // }
    // else {
    //   let newCollection = new ERC1155Contract(event.address.toHexString());
    //   newCollection.name = event.params.name;
    //   newCollection.symbol = event.params.symbol;
    //   newCollection.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    //   newCollection.count = BigInt.fromI32(0);
    //   newCollection.holderCount = BigInt.fromI32(0);
    //   newCollection.save()
    // }
  }

  export function handle1155Creators(event: Creators): void {
    // // let tokenId = event.params.tokenId.toString();
    // let collection = ERC1155Contract.load(event.address.toHexString());

    // // Create the Collection entity if it doesn't exist
    // if (!collection) {
    //   collection = new ERC1155Contract(event.address.toHexString());
    //   // Initialize other necessary fields for Collection
    //   collection.txCreation = event.transaction.hash.toHexString();
    //   collection.save();
    // }

    // let creatorsArray = event.params.creators;
    // for (let i = 0; i < creatorsArray.length; i++) {
    //   let creatorAddress = creatorsArray[i].account;
    //   let share = creatorsArray[i].value;
    //   let creatorId = creatorAddress.toHex();

    //   let creator = creator.load(creatorId);
    //   if (!creator) {
    //     creator = new creator(creatorId);
    //     // Initialize other necessary fields for Creator
    //     creator.save();
    //   }

    //   // let collectionCreatorId = collection.id + "-" + creatorId;
    //   let collectionCreatorId = generateCombineKey([collection.id, creatorId]);
    //   let collectionCreator = new ERC1155Creator(collectionCreatorId);
    //   collectionCreator.collection = collection.id;
    //   collectionCreator.creator = creatorId;
    //   collectionCreator.share = share; // Assuming share can be represented as BigInt
    //   collectionCreator.save();
    // }
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

  export function handleSupply(event: Supply): void {
    // let tokenId = generateCombineKey([event.address.toHexString(), event.params.tokenId.toString()]);
    // let token = ERC1155Token.load(tokenId);
    // if (token === null) {
    //   token = new ERC1155Token(tokenId);
    //   token.tokenId = event.params.tokenId.toString()
    //   token.txCreation = event.transaction.hash.toHexString();
    //   updateBlockEntity(event, event.address, event.params.tokenId, Address.fromString(ContractAddress.ZERO), Address.fromString(ContractAddress.ZERO), 'Mint', BigInt.fromI32(0), event.params.value, Address.fromString(ContractAddress.ZERO));
    //   updateContractCount(event.address.toHexString(), BigInt.fromI32(1), 'ERC1155');
    // }
    // token.identifier = event.params.tokenId;
    // token.contract = event.address.toHexString();
    // // Assume we create a balance entity for totalSupply
    // let balanceId = generateCombineKey([event.address.toHex(), event.params.tokenId.toString()])
    // let totalSupply = new ERC1155Balance(balanceId);
    // totalSupply.value = event.params.value.toBigDecimal();
    // totalSupply.valueExact = event.params.value;
    // totalSupply.contract = event.address.toHex();
    // totalSupply.token = token.id;
    // totalSupply.save();

    // token.totalSupply = totalSupply.id;
    // token.save();
  }

  export function handleURI(event: URI): void {
    // let token = ERC1155Token.load(event.params.id.toString());
    // if (token) {
    //   token.uri = event.params.value.toString();
    //   token.save();
    // }
  }