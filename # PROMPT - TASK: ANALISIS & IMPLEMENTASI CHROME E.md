# TASK: ANALISIS & IMPLEMENTASI CHROME EXTENSION — SMART BOOKMARK MANAGER

## Background

Saat ini browser Chrome menggunakan Bookmark Bar bawaan untuk menampilkan bookmark.

Kendala:

* Bookmark Bar memakan ruang vertikal pada browser.
* Jumlah bookmark semakin banyak sehingga sulit dicari.
* Folder bookmark bertingkat menjadi kurang nyaman digunakan.
* Saya ingin menyembunyikan Bookmark Bar sepenuhnya dan menggantinya dengan Chrome Extension yang lebih modern.

Tujuan utama:

Membangun Chrome Extension yang dapat:

1. Membaca seluruh bookmark Chrome.
2. Menampilkan bookmark dalam UI yang lebih modern dalam popup saat klik extension icon.
3. Memiliki fitur pencarian cepat.
4. Mendukung folder bookmark bertingkat.
5. Mendukung bookmark favorit/pinned.
6. Mendukung recent bookmark.
7. Mendukung dark & light mode.
8. Mendukung Side Panel Chrome (opsional).
9. Tetap menggunakan data bookmark asli Chrome (tidak membuat database bookmark baru).

---

# PHASE 1 — ANALISIS

Lakukan analisis terlebih dahulu terhadap:

## Chrome APIs yang dibutuhkan

* chrome.bookmarks
* chrome.storage
* chrome.sidePanel
* chrome.tabs
* chrome.commands
* chrome.contextMenus

Jelaskan:

* Kelebihan
* Kekurangan
* Limitasi
* Permission yang dibutuhkan

---

## UX Research

Bandingkan UX dari:

* Chrome Bookmark Bar
* Arc Browser Favorites
* Edge Sidebar
* Raindrop.io
* Workona

Cari ide terbaik yang dapat diterapkan.

Fokus:

* Kecepatan akses
* Minimal penggunaan ruang
* Keyboard friendly
* Productivity

---

## Rekomendasi Arsitektur

Tentukan apakah lebih baik:

### Opsi A

Popup Extension

Pros:

* Cepat
* Mudah dibuat

Cons:

* Area kecil

### Opsi B

Side Panel

Pros:

* Lebih luas
* Cocok untuk banyak bookmark

Cons:

* Sedikit lebih kompleks

### Opsi C

Hybrid

Popup + Side Panel

Berikan rekomendasi akhir.

---

# PHASE 2 — IMPLEMENTASI

Gunakan:

* Manifest V3
* Vanilla JS
* HTML
* CSS

Tidak perlu React pada versi pertama.

Target:

* Ringan
* Cepat
* Mudah di-maintain

---

# Struktur Folder

bookmark-manager/

├── manifest.json
│
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
│
├── sidepanel/
│   ├── sidepanel.html
│   ├── sidepanel.js
│   └── sidepanel.css
│
├── background/
│   └── service-worker.js
│
├── components/
│   ├── bookmark-tree.js
│   ├── bookmark-search.js
│   ├── bookmark-card.js
│   └── recent-bookmarks.js
│
├── assets/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
└── storage/
└── settings.js

---

# Manifest

Buat manifest lengkap.

Minimal:

{
"manifest_version": 3,
"name": "Smart Bookmark Manager",
"version": "1.0.0",
"description": "Modern bookmark manager for Chrome",
"permissions": [
"bookmarks",
"storage",
"tabs",
"sidePanel"
],
"host_permissions": [],
"background": {
"service_worker": "background/service-worker.js"
},
"action": {
"default_popup": "popup/popup.html"
},
"side_panel": {
"default_path": "sidepanel/sidepanel.html"
}
}

Evaluasi apakah masih ada permission lain yang diperlukan.

---

# Fitur Wajib v1

## 1. Global Search

User dapat mencari:

* title
* url

Realtime.

Target:

< 100 ms untuk 1000 bookmark.

---

## 2. Bookmark Tree

Render:

Folder
├── Folder
├── Folder
└── Bookmark

Harus mendukung collapse/expand.

---

## 3. Open Bookmark

Klik bookmark:

chrome.tabs.create()

---

## 4. Pin Bookmark

User dapat pin bookmark.

Data disimpan di:

chrome.storage.local

Schema:

{
pinned: [
bookmarkId
]
}

---

## 5. Recent Opened

Simpan history bookmark yang dibuka.

Schema:

{
recent: [
{
id,
title,
url,
openedAt
}
]
}

Batasi maksimal:

20 item.

---

## 6. Dark Theme

Default dark.

Warna:

Background:
#0f1115

Panel:
#171a21

Border:
#272b35

Text:
#f5f7fa

Accent:
#4f8cff

---

## 7. Keyboard Shortcut

Ctrl + K

atau

Cmd + K

untuk membuka search.

Analisis apakah memungkinkan menggunakan:

chrome.commands

atau solusi lain.

---

# Fitur v2 (Roadmap)

Belum perlu dibuat.

Namun lakukan analisis desain dan effort.

## Smart Folder

Folder virtual berdasarkan:

* Domain
* Tag
* Frekuensi akses

---

## AI Search

Contoh:

"buka github"

langsung menemukan:

https://github.com

---

## Workspace

Mode:

Development
Trading
Research
Personal

Bookmark dapat dikelompokkan.

---

## Bookmark Analytics

Menampilkan:

* Most Opened
* Least Opened
* Recently Opened
* Unused Bookmark

---

# UI Requirement

Style modern.

Referensi:

* Arc Browser
* Linear
* Notion
* Raycast

Karakteristik:

* Minimalis
* Dark mode
* Rounded corners
* Smooth hover
* Compact layout

---

# Output Yang Saya Inginkan

Berikan output dalam urutan:

1. Analisis arsitektur terbaik
2. Analisis UX
3. Struktur folder final
4. Manifest final
5. Source code lengkap setiap file
6. Cara load extension ke Chrome
7. Improvement roadmap
8. Potensi masalah dan solusinya
9. Rekomendasi fitur premium untuk masa depan

PENTING:

Jangan langsung coding semuanya.

Lakukan analisis mendalam terlebih dahulu.

Jika ada bagian yang dapat dibuat lebih baik dari spesifikasi saya, berikan rekomendasi dan alasannya.
