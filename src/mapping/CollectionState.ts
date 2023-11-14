import { Collection } from "../../generated/schema";
// import { CreateTokenCall } from "../../generated/ERC721Factory/ERC721Factory";
import { Create721RaribleProxy, Create721RaribleUserProxy } from "../../generated/ERC721Factory/ERC721Factory";
import { Create1155RaribleProxy, Create1155RaribleUserProxy } from "../../generated/ERC1155Factory/ERC1155Factory";
import { ERC721Proxy } from "../../generated/templates";
import { ERC1155Proxy } from "../../generated/templates";
export function handle721Proxy(event: Create721RaribleProxy): void {
    let newToken = new Collection(event.params.proxy.toHexString());
    newToken.owner = event.transaction.from.toHex();
    newToken.txCreation = event.transaction.hash.toHexString();
    ERC721Proxy.create(event.params.proxy);
    newToken.save();
}

export function handle721UserProxy(event: Create721RaribleUserProxy): void {
    let newToken = new Collection(event.params.proxy.toHexString());
    newToken.owner = event.transaction.from.toHex();
    newToken.txCreation = event.transaction.hash.toHexString();
    ERC721Proxy.create(event.params.proxy);
    newToken.save();
}

export function handle1155Proxy(event: Create1155RaribleProxy): void {
    let newToken = new Collection(event.params.proxy.toHexString());
    newToken.owner = event.transaction.from.toHex();
    newToken.txCreation = event.transaction.hash.toHexString();
    ERC1155Proxy.create(event.params.proxy);
    newToken.save();
}

export function handle1155UserProxy(event: Create1155RaribleUserProxy): void {
    let newToken = new Collection(event.params.proxy.toHexString());
    newToken.owner = event.transaction.from.toHex();
    newToken.txCreation = event.transaction.hash.toHexString();
    ERC1155Proxy.create(event.params.proxy);
    newToken.save();
}
