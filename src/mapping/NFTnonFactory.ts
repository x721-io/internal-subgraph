import { Account, Creator, ERC1155Balance, ERC1155Contract, ERC1155Creator, ERC1155Token, ERC1155Transfer, ERC721Contract, ERC721Creator, ERC721Token, ERC721Transfer, Transaction } from "../../generated/schema";
import { Approval, ApprovalForAll, BaseUriChanged, CreateERC721Rarible, CreateERC721RaribleUser, Creators, DefaultApproval, MinterStatusChanged, RoyaltiesSet, Transfer } from "../../generated/templates/ERC721Proxy/ERC721Proxy";
import { CreateERC1155Rarible, CreateERC1155RaribleUser, Supply, TransferBatch, TransferSingle, URI } from "../../generated/templates/ERC1155Proxy/ERC1155Proxy";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { fetchOrCreateAccount, generateCombineKey, updateBlockEntity, updateERC1155Balance , fetchOrCreateERC721Tokens, fetchOrCreateERC1155Tokens } from "../utils";
import { ContractAddress } from "../enum";
export function handleTransfer(event: Transfer): void {
  if (event.params.to.toHexString() == ContractAddress.erc721marketplace) {
    log.info('Transfer to marketplace: {} {}', [event.params.to.toHexString(), ContractAddress.erc721marketplace])
    return;
  }
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
    let zeroAccount = Account.load('0x0000000000000000000000000000000000000000');
    updateBlockEntity(event, event.address, event.params.tokenId, event.params.from, event.params.to, 'Mint', BigInt.fromI32(0), BigInt.fromI32(1), Address.fromString(ContractAddress.ZERO));
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
    updateBlockEntity(event, event.address, event.params.tokenId, event.params.from, event.params.to, 'Transfer', BigInt.fromI32(0), BigInt.fromI32(1), Address.fromString(ContractAddress.ZERO));
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
    let accountFromId = event.params.from.toHex();
    let accountFrom = Account.load(accountFromId);
    if (accountFrom == null) {
      accountFrom = new Account(accountFromId);
      accountFrom.save();
    }
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
    contract.asAccount = fetchOrCreateAccount(event.params.to).id;
    contract.save()
    }
  }
  export function handleTransferSingleNoFactory(event: TransferSingle): void {
    if (event.params.to.toHexString() == ContractAddress.erc1155marketplace) {
      return;
    }
    let transaction = Transaction.load(event.transaction.hash.toHex());
    if (transaction == null) {
      transaction = new Transaction(event.transaction.hash.toHex());
      transaction.timestamp = event.block.timestamp;
      transaction.blockNumber = event.block.number;
      transaction.save();
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
      contract.asAccount = fetchOrCreateAccount(event.params.to).id;
      contract.save()
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
      token.save();
    } else {
      // Create a new ERC1155Token entity
      token = new ERC1155Token(tokenId);
      token.tokenId = event.params.id.toString();
      token.contract = event.address.toHex();
      token.identifier = event.params.id; // Replace with actual data if available
      token.uri = null;  // Replace with actual data if available
      // token.totalSupply = "";  // Replace with actual data if available
      token.txCreation = event.transaction.hash.toHexString()
      let totalSupply = updateERC1155Balance(event.params.to, tokenId, event.params.value, event.address.toHex());
      if(totalSupply){
        token.totalSupply = totalSupply.id;
      }
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