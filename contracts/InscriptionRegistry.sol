// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title InscriptionRegistry
 * @notice STELE — Immutable Witness Protocol
 * @dev Anchors journalism inscriptions, vouches, and flags on World Chain.
 *      WHO (World ID nullifier) + WHAT (SHA-256 hash) + WHERE (IPFS CID)
 *      Every social action — publish, vouch, flag — is on-chain.
 */
contract InscriptionRegistry {

    // ─── Inscription ───────────────────────────────────────────────────────────

    struct Inscription {
        bytes32 contentHash;
        bytes32 nullifierHash;
        string  ipfsCid;
        string  verificationTier;
        uint256 timestamp;
        address author;
    }

    Inscription[] private _inscriptions;
    mapping(bytes32 => bool)    private _contentHashUsed;
    mapping(bytes32 => uint256) private _contentHashToId;

    event Inscribed(
        uint256 indexed id,
        bytes32 indexed contentHash,
        bytes32 indexed nullifierHash,
        string ipfsCid,
        string verificationTier,
        uint256 timestamp
    );

    error ContentAlreadyAnchored();
    error EmptyCid();
    error EmptyContentHash();

    // ─── Vouch ─────────────────────────────────────────────────────────────────

    struct Vouch {
        bytes32 inscriptionContentHash;
        bytes32 nullifierHash;
        string  verificationTier;
        uint256 timestamp;
    }

    Vouch[] private _vouches;
    mapping(bytes32 => bool) private _vouchUsed; // keccak256(contentHash, nullifier)

    event Vouched(
        uint256 indexed id,
        bytes32 indexed inscriptionContentHash,
        bytes32 indexed nullifierHash,
        string verificationTier,
        uint256 timestamp
    );

    error AlreadyVouched();
    error InscriptionNotFound();

    // ─── Flag ──────────────────────────────────────────────────────────────────

    struct Flag {
        bytes32 inscriptionContentHash;
        bytes32 nullifierHash;
        uint256 timestamp;
    }

    Flag[] private _flags;
    mapping(bytes32 => bool) private _flagUsed; // keccak256(contentHash, nullifier)

    event Flagged(
        uint256 indexed id,
        bytes32 indexed inscriptionContentHash,
        bytes32 indexed nullifierHash,
        uint256 timestamp
    );

    error AlreadyFlagged();

    // ─── Admin ─────────────────────────────────────────────────────────────────

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // ─── Inscription ───────────────────────────────────────────────────────────

    /**
     * @notice Anchor an inscription on World Chain
     * @param contentHash  SHA-256 hash of evidence (bytes32) — unique per story
     * @param nullifierHash World ID nullifier — proof of unique human authorship
     * @param ipfsCid      Storacha/IPFS CID of the full content
     * @param verificationTier "orb" or "device"
     */
    function inscribe(
        bytes32 contentHash,
        bytes32 nullifierHash,
        string calldata ipfsCid,
        string calldata verificationTier
    ) external returns (uint256 id) {
        if (bytes(ipfsCid).length == 0) revert EmptyCid();
        if (contentHash == bytes32(0)) revert EmptyContentHash();
        if (_contentHashUsed[contentHash]) revert ContentAlreadyAnchored();

        _contentHashUsed[contentHash] = true;

        id = _inscriptions.length;
        _contentHashToId[contentHash] = id;
        _inscriptions.push(Inscription({
            contentHash: contentHash,
            nullifierHash: nullifierHash,
            ipfsCid: ipfsCid,
            verificationTier: verificationTier,
            timestamp: block.timestamp,
            author: msg.sender
        }));

        emit Inscribed(id, contentHash, nullifierHash, ipfsCid, verificationTier, block.timestamp);
    }

    // ─── Vouch ─────────────────────────────────────────────────────────────────

    /**
     * @notice Vouch for an inscription — World ID required (1 per human per story)
     * @param inscriptionContentHash SHA-256 hash of the story being vouched for
     * @param nullifierHash          World ID nullifier of the vouching human
     * @param verificationTier       "orb" (+10 pts weight) or "device" (+1 pt)
     */
    function vouch(
        bytes32 inscriptionContentHash,
        bytes32 nullifierHash,
        string calldata verificationTier
    ) external returns (uint256 id) {
        if (!_contentHashUsed[inscriptionContentHash]) revert InscriptionNotFound();

        bytes32 key = keccak256(abi.encodePacked(inscriptionContentHash, nullifierHash));
        if (_vouchUsed[key]) revert AlreadyVouched();

        _vouchUsed[key] = true;

        id = _vouches.length;
        _vouches.push(Vouch({
            inscriptionContentHash: inscriptionContentHash,
            nullifierHash: nullifierHash,
            verificationTier: verificationTier,
            timestamp: block.timestamp
        }));

        emit Vouched(id, inscriptionContentHash, nullifierHash, verificationTier, block.timestamp);
    }

    // ─── Flag ──────────────────────────────────────────────────────────────────

    /**
     * @notice Flag an inscription as disputed — World ID required (1 per human per story)
     * @param inscriptionContentHash SHA-256 hash of the story being flagged
     * @param nullifierHash          World ID nullifier of the flagging human
     */
    function flag(
        bytes32 inscriptionContentHash,
        bytes32 nullifierHash
    ) external returns (uint256 id) {
        if (!_contentHashUsed[inscriptionContentHash]) revert InscriptionNotFound();

        bytes32 key = keccak256(abi.encodePacked(inscriptionContentHash, nullifierHash));
        if (_flagUsed[key]) revert AlreadyFlagged();

        _flagUsed[key] = true;

        id = _flags.length;
        _flags.push(Flag({
            inscriptionContentHash: inscriptionContentHash,
            nullifierHash: nullifierHash,
            timestamp: block.timestamp
        }));

        emit Flagged(id, inscriptionContentHash, nullifierHash, block.timestamp);
    }

    // ─── Views ─────────────────────────────────────────────────────────────────

    function getInscription(uint256 id) external view returns (Inscription memory) {
        return _inscriptions[id];
    }

    function getCount() external view returns (uint256) {
        return _inscriptions.length;
    }

    function getVouchCount() external view returns (uint256) {
        return _vouches.length;
    }

    function getFlagCount() external view returns (uint256) {
        return _flags.length;
    }

    function isContentAnchored(bytes32 contentHash) external view returns (bool) {
        return _contentHashUsed[contentHash];
    }

    function hasVouched(bytes32 inscriptionContentHash, bytes32 nullifierHash) external view returns (bool) {
        return _vouchUsed[keccak256(abi.encodePacked(inscriptionContentHash, nullifierHash))];
    }

    function hasFlagged(bytes32 inscriptionContentHash, bytes32 nullifierHash) external view returns (bool) {
        return _flagUsed[keccak256(abi.encodePacked(inscriptionContentHash, nullifierHash))];
    }
}
