import { Collection } from "../../generated/schema";
// import { CreateTokenCall } from "../../generated/ERC721Factory/ERC721Factory";
import { Create721RaribleProxy, Create721RaribleUserProxy } from "../../generated/ERC721Factory/ERC721Factory";
import { Create1155RaribleProxy, Create1155RaribleUserProxy } from "../../generated/ERC1155Factory/ERC1155Factory";
import { CreateERC721Rarible, CreateERC721RaribleUser } from "../../generated/templates/ERC721Proxy/ERC721Proxy";
import { ERC721Proxy } from "../../generated/templates";
import { ERC1155Proxy } from "../../generated/templates";
export function handle721Proxy(event: Create721RaribleProxy): void {
    let newToken = new Collection(event.params.proxy.toHexString());
    newToken.owner = event.transaction.from.toHex();
    ERC721Proxy.create(event.params.proxy);
    newToken.save();
}

export function handle1155Proxy(event: Create1155RaribleUserProxy): void {
    let newToken = new Collection(event.params.proxy.toHexString());
    newToken.owner = event.transaction.from.toHex();
    ERC1155Proxy.create(event.params.proxy);
    newToken.save();
}

export function handle721UserProxy(event: Create721RaribleUserProxy): void {
    let newToken = new Collection(event.params.proxy.toHexString());
    newToken.owner = event.transaction.from.toHex();
    ERC721Proxy.create(event.params.proxy);
    newToken.save();
}