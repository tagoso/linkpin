# URLL: A Simple Bookmark Manager

URLL is live. Start today!
[`https://urll.tago.so/`](https://urll.tago.so/)

<img src="https://raw.githubusercontent.com/tagoso/urll/refs/heads/main/src/frontend/public/URLL-logo-long-white-background.png" alt="Long URLL Logo" style="max-width: 160px; width: 100%; height: auto;">

URLL (short for URL List 😉) is a **100% on-chain, secure, and decentralized bookmark manager**. Built on the Internet Computer (ICP), it ensures that all your bookmarks are securely stored, tamper-proof, and accessible from anywhere. With URLL, your URLs are completely under your control—no intermediaries, no data servers.

## How to Use

1. **Login**: Use your Internet Identity to log in securely.
2. **Add a Bookmark**: Enter a URL and click "Save" to add it to your list.
3. **Manage Your Bookmarks**:
   - Sort by clicks, last visit, alphabetical order, or even shuffle them randomly!
   - Delete or edit existing bookmarks effortlessly.

## Features

- **100% On-Chain Storage**: All data is stored on the Internet Computer blockchain.
- **Anti-Phishing Code**: Displays a unique code upon login to protect against phishing attacks.
- **Secure URL Management**: Add, sort, delete, and manage your bookmarks with ease.
- **Click Analytics**: Track the number of times a URL is clicked and its last visit time.
- **Open Source**: Fully open-source and customizable.

## Technologies Used

- **Blockchain**: Internet Computer (ICP)
- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Motoko smart contracts

## Acknowledgments

My deepest gratitude goes to [@kristoferlund](https://github.com/kristoferlund) for maintaining the following NPM packages. These libraries were indispensable in bringing URLL to life!

- **[`ic-use-internet-identity`](https://github.com/kristoferlund/ic-use-internet-identity)**: This package offers a seamless and intuitive way to integrate Internet Identity (II) authentication into React applications. Without it, URLL's smooth login functionality wouldn't have been possible.

- **[`ic-use-actor`](https://github.com/kristoferlund/ic-use-actor)**: Simplifies managing actors on the Internet Computer, making interactions with canisters straightforward and maintainable.
