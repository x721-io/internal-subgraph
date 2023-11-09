import { Collection, NFT } from "../../generated/schema";
import { Approval, ApprovalForAll, BaseUriChanged, CreateERC721Rarible, CreateERC721RaribleUser, Creators, DefaultApproval, MinterStatusChanged, RoyaltiesSet, Transfer } from "../../generated/templates/ERC721Proxy/ERC721Proxy";
import { TransferSingle } from "../../generated/templates/ERC1155Proxy/ERC1155Proxy";
import { ZERO_ADDRESS } from "../rarible-helper";
import { log } from "@graphprotocol/graph-ts";
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
  
  export function handleCreators(event: Creators): void {
    // Logic to handle the Creators event
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
    let tokenID = event.params.tokenId.toString();
    let nft = NFT.load(tokenID);
  
    // The zero address indicates a minting event
    if (event.params.from.toHexString() == "0x0000000000000000000000000000000000000000") {
      if (!nft) {
        nft = new NFT(tokenID);
        nft.creators = [event.params.to.toHex().toString()];
        nft.mintedAt = event.block.timestamp;
        nft.lastUpdatedAt = event.block.timestamp;
        nft.totalStock = 1; // ERC721 tokens typically have a stock of 1
        nft.deleted = false;
        nft.tokenId = event.params.tokenId;
        nft.owner = event.transaction.from.toHexString();
        nft.contract = event.address.toHexString();
        nft.collection = event.address.toHexString();
      }
    }
  
    // Update the owner field on each transfer after minting
    if (nft) {
      nft.owner = event.params.to.toHex();
      nft.lastUpdatedAt = event.block.timestamp;
      nft.save();
    }
  }
    export function handleTransferSingle(event: TransferSingle): void {
      let tokenID = event.params.id.toString();
      let nft = NFT.load(tokenID);
    
      // Check if the token is being minted (transferred from the zero address)
      if (event.params.from.toHexString() == "0x0000000000000000000000000000000000000000") {
        // Only create a new NFT if it doesn't already exist
        if (!nft) {
          nft = new NFT(tokenID);
          nft.contract = event.address.toHex();
          nft.tokenId = event.params.id;
          nft.creators = [event.params.to.toHex()];
          nft.mintedAt = event.block.timestamp;
          nft.lastUpdatedAt = event.block.timestamp;
          nft.totalStock = event.params.value.toI32();
          nft.deleted = false;
          nft.contract = event.address.toHexString();
          nft.collection = event.address.toHexString();
          nft.owner = event.transaction.from.toHexString()
          // Add any additional fields you need to store for the NFT
          // nft.meta = extractMetaData(event.params.id);
          nft.save();
        }
      } else {
        // If the token already exists, update the total stock and last updated timestamp
        if (nft) {
          let newTotalStock = nft.totalStock + event.params.value.toI32();
          nft.totalStock = newTotalStock;
          nft.lastUpdatedAt = event.block.timestamp;
          nft.save();
        }
      }
    }