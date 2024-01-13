
import { Create721RaribleUserProxy as Create721Legacy, CreateERC721RaribleUser } from "../../generated/ERC721FactoryLegacy/ERC721LegacyFactory";
import { Account, ERC721Contract, ERC721Token } from "../../generated/schema";
import { ERC721Proxy } from "../../generated/templates";
import { fetchOrCreateAccount, generateCombineKey, updateBlockEntity, updateContractCount } from "../utils";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {ERC721Proxy as erc721Contract} from "../../generated/ERC721Proxy/ERC721Proxy"
import {ERC721LegacyFactory as factoryContract } from "../../generated/ERC721FactoryLegacy/ERC721LegacyFactory"
import { ContractAddress } from "../enum";

export function handle721UserProxyLegacy(event: Create721Legacy): void {
    let newToken = new ERC721Contract(event.params.proxy.toHexString());
    newToken.asAccount = fetchOrCreateAccount(event.transaction.from).id;
    newToken.txCreation = event.transaction.hash.toHexString();
    newToken.count = BigInt.fromI32(0);
    newToken.holderCount = BigInt.fromI32(0);
    ERC721Proxy.create(event.params.proxy);
    newToken.save();
    const contractFactory = factoryContract.bind(event.address)
    let limit = contractFactory.maxTokenIds(event.params.proxy);
    log.warning('limit: {}', [limit.toString()])
    const contract = erc721Contract.bind(event.params.proxy)
    for (let i = 1; i <= limit.toI32(); i++) {
        const owner = contract.ownerOf(BigInt.fromI32(i));
        let tokenId = generateCombineKey([event.address.toHexString(), i.toString()]);
        let token = ERC721Token.load(tokenId);
        if (token == null) {
            token = new ERC721Token(tokenId);
            token.tokenId = i.toString();
            token.contract = event.address.toHexString();
            token.identifier = BigInt.fromI32(i);
            token.owner = owner.toHexString();
            token.txCreation = event.transaction.hash.toHexString()
            let zeroAccount = Account.load('0x0000000000000000000000000000000000000000');
            updateBlockEntity(event, event.address, BigInt.fromI32(i), Address.fromString(ContractAddress.ZERO), owner, 'Mint', BigInt.fromI32(0), BigInt.fromI32(1), Address.fromString(ContractAddress.ZERO));
            updateContractCount(event.address.toHexString(), BigInt.fromI32(1), 'ERC721');    
            if (zeroAccount == null) {
              zeroAccount = new Account('0x0000000000000000000000000000000000000000');
              zeroAccount.save();
            }
            // Set the approval to the zero address when the token is minted
            token.approval = zeroAccount.id;
            token.uri = ""; // Set the URI based on your logic
            token.save();
          }
    }
}

export function handle721UserRaribleLegacy(event: CreateERC721RaribleUser): void {
    let collection = ERC721Contract.load(event.address.toHexString());
    if (collection !== null) {
        collection.name = event.params.name;
        collection.symbol = event.params.symbol;
        collection.count = BigInt.fromI32(0);
        collection.holderCount = BigInt.fromI32(0);
        collection.save();
    }
    else {
        let newCollection = new ERC721Contract(event.address.toHexString());
        newCollection.name = event.params.name;
        newCollection.symbol = event.params.symbol;
        newCollection.txCreation = event.transaction.hash.toHexString();
        newCollection.asAccount = fetchOrCreateAccount(event.transaction.from).id;;
        newCollection.count = BigInt.fromI32(0);
        newCollection.holderCount = BigInt.fromI32(0);
        newCollection.save()
    }
}

