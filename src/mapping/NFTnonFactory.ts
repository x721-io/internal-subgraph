import { Account, Creator, ERC1155Balance, ERC1155Contract, ERC1155Creator, ERC1155Token, ERC1155Transfer, ERC721Contract, ERC721Creator, ERC721Token, ERC721Transfer, Transaction } from "../../generated/schema";
import { Approval, ApprovalForAll, BaseUriChanged, CreateERC721Rarible, CreateERC721RaribleUser, Creators, DefaultApproval, MinterStatusChanged, RoyaltiesSet, Transfer } from "../../generated/templates/ERC721Proxy/ERC721Proxy";
import { CreateERC1155Rarible, CreateERC1155RaribleUser, Supply, TransferBatch, TransferSingle, URI } from "../../generated/templates/ERC1155Proxy/ERC1155Proxy";
import { BigInt, log } from "@graphprotocol/graph-ts";
import { fetchOrCreateAccount, generateCombineKey, updateBlockEntity, updateERC1155Balance , fetchOrCreateERC721Tokens } from "../utils";
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
    updateBlockEntity(event, event.address, event.params.tokenId, event.params.from, event.params.to, 'Mint', BigInt.fromI32(0), BigInt.fromI32(0));
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
    updateBlockEntity(event, event.address, event.params.tokenId, event.params.from, event.params.to, 'Transfer', BigInt.fromI32(0), BigInt.fromI32(0));
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