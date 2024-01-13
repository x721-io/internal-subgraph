import { ERC1155Contract, ERC721Contract } from "../../generated/schema";
// import { CreateTokenCall } from "../../generated/ERC721Factory/ERC721Factory";
import { Create721RaribleProxy, Create721RaribleUserProxy } from "../../generated/ERC721Factory/ERC721Factory";
import { Create721RaribleUserProxy as Create721Legacy } from "../../generated/ERC721FactoryLegacy/ERC721LegacyFactory";
import { Create1155RaribleProxy, Create1155RaribleUserProxy } from "../../generated/ERC1155Factory/ERC1155Factory";
import { ERC721Proxy } from "../../generated/templates";
import { ERC1155Proxy } from "../../generated/templates";
import { fetchOrCreateAccount, updateBlockEntity } from "../utils";
import { BigInt } from "@graphprotocol/graph-ts";

export function handle721Proxy(event: Create721RaribleProxy): void {
    let newToken = new ERC721Contract(event.params.proxy.toHexString());
    newToken.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    newToken.txCreation = event.transaction.hash.toHexString();
    newToken.count = BigInt.fromI32(0);
    newToken.holderCount = BigInt.fromI32(0);
    ERC721Proxy.create(event.params.proxy);
    newToken.save();
}

export function handle721UserProxy(event: Create721RaribleUserProxy): void {
    let newToken = new ERC721Contract(event.params.proxy.toHexString());
    newToken.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    newToken.txCreation = event.transaction.hash.toHexString();
    newToken.count = BigInt.fromI32(0);
    newToken.holderCount = BigInt.fromI32(0);
    ERC721Proxy.create(event.params.proxy);
    newToken.save();
}

// export function handle721ProxyLegacy(event: Create721RaribleProxy): void {
//     let newToken = new ERC721Contract(event.params.proxy.toHexString());
//     newToken.asAccount = fetchOrCreateAccount(event.transaction.from).id;
//     newToken.txCreation = event.transaction.hash.toHexString();
//     newToken.count = BigInt.fromI32(0);
//     newToken.holderCount = BigInt.fromI32(0);
//     ERC721Proxy.create(event.params.proxy);
//     newToken.save();
// }

export function handle721UserProxyLegacy(event: Create721Legacy): void {
    let newToken = new ERC721Contract(event.params.proxy.toHexString());
    newToken.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    newToken.txCreation = event.transaction.hash.toHexString();
    newToken.count = BigInt.fromI32(0);
    newToken.holderCount = BigInt.fromI32(0);
    ERC721Proxy.create(event.params.proxy);
    newToken.save();
}

export function handle1155Proxy(event: Create1155RaribleProxy): void {
    let newToken = new ERC1155Contract(event.params.proxy.toHexString());
    newToken.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    newToken.txCreation = event.transaction.hash.toHexString();
    newToken.count = BigInt.fromI32(0);
    newToken.holderCount = BigInt.fromI32(0);
    ERC1155Proxy.create(event.params.proxy);
    newToken.save();
}

export function handle1155UserProxy(event: Create1155RaribleUserProxy): void {
    let newToken = new ERC1155Contract(event.params.proxy.toHexString());
    newToken.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    newToken.txCreation = event.transaction.hash.toHexString();
    newToken.count = BigInt.fromI32(0);
    newToken.holderCount = BigInt.fromI32(0);
    ERC1155Proxy.create(event.params.proxy);
    newToken.save();
}
