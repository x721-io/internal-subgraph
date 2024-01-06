import { ERC1155Contract, ERC721Contract } from "../../generated/schema";
// import { CreateTokenCall } from "../../generated/ERC721Factory/ERC721Factory";
import { Create721RaribleProxy, Create721RaribleUserProxy } from "../../generated/ERC721Factory/ERC721Factory";
import { Create1155RaribleProxy, Create1155RaribleUserProxy } from "../../generated/ERC1155Factory/ERC1155Factory";
import { ERC721Proxy } from "../../generated/templates";
import { ERC1155Proxy } from "../../generated/templates";
import { fetchOrCreateAccount, updateBlockEntity, updateERC721ContractState, updateERC1155ContractState } from "../utils";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
export function handle721Proxy(event: Create721RaribleProxy): void {
    let newToken = new ERC721Contract(event.params.proxy.toHexString());
    newToken.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    newToken.txCreation = event.transaction.hash.toHexString();
    ERC721Proxy.create(event.params.proxy);
    updateERC721ContractState(event, event.address.toHexString() , BigInt.fromI32(0) , BigInt.fromI32(0));
    newToken.save();
}

export function handle721UserProxy(event: Create721RaribleUserProxy): void {
    let newToken = new ERC721Contract(event.params.proxy.toHexString());
    newToken.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    newToken.txCreation = event.transaction.hash.toHexString();
    ERC721Proxy.create(event.params.proxy);
    updateERC721ContractState(event, event.address.toHexString() , BigInt.fromI32(0) , BigInt.fromI32(0));
    newToken.save();
}

export function handle1155Proxy(event: Create1155RaribleProxy): void {
    let newToken = new ERC1155Contract(event.params.proxy.toHexString());
    newToken.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    newToken.txCreation = event.transaction.hash.toHexString();
    ERC1155Proxy.create(event.params.proxy);
    updateERC1155ContractState(event, event.address.toHexString() , BigInt.fromI32(0) , BigInt.fromI32(0));
    newToken.save();
}

export function handle1155UserProxy(event: Create1155RaribleUserProxy): void {
    let newToken = new ERC1155Contract(event.params.proxy.toHexString());
    newToken.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    newToken.txCreation = event.transaction.hash.toHexString();
    ERC1155Proxy.create(event.params.proxy);
    updateERC1155ContractState(event, event.address.toHexString() , BigInt.fromI32(0) , BigInt.fromI32(0));
    newToken.save();
}
