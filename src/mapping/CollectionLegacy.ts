
import { Create721RaribleUserProxy as Create721Legacy, CreateERC721RaribleUser } from "../../generated/ERC721FactoryLegacy/ERC721LegacyFactory";
import { Account, ERC721Contract, ERC721Token } from "../../generated/schema";
import { ERC721Proxy } from "../../generated/templates";
import { fetchOrCreateAccount, generateCombineKey, initializeNFTCollectionState, updateBlockEntity, updateContractCount } from "../utils";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { NFT as erc721Contract} from '../../generated/NFT/NFT'
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
    log.warning('limit: {} {}', [limit.toString(), event.params.proxy.toHexString()])
    initializeNFTCollectionState(event.params.proxy, limit)
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

