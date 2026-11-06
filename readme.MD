# Form Photo Fixer 📸

A fast, client-side web application designed to instantly format and compress photos and signatures for exam and job application forms. Built to solve the frustration of strict image requirements by combining cropping, resizing, and precise file-size compression into one seamless step.

## ✨ Features

- **100% Client-Side Processing:** All image cropping and compression happens directly in your browser. No backend required, ensuring privacy and allowing it to work offline after the initial load.
- **Official Form Presets:** Quick-select dropdown for common exam portals (e.g., UPSC, SSC, IBPS) that automatically applies required dimensions and strict maximum file size (KB) limits.
- **Custom Configuration:** Manually enter specific dimensions and KB limits for unlisted forms.
- **Guided Cropping:** Integrated face-guide overlay to help perfectly align head and shoulders before cropping.
- **Dynamic Compression Engine:** Uses the HTML5 Canvas API to iteratively step down image quality until the output file is precisely under the required KB limit.
- **Real-Time Feedback:** Visual progress indicators and success states let you know exactly when your file is compliant and ready to upload.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Image Processing:** HTML5 Canvas API & `react-image-crop` (or similar client-side cropping library)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/mdyusuf06/Form-Photo-Fixer.git](https://github.com/mdyusuf06/Form-Photo-Fixer.git)