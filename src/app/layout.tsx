import type {
  Metadata,
  Viewport,
} from "next";

import type {
  ReactNode,
} from "react";

import {
  AppProviders,
} from "@/components/providers/app-providers";

import {
  siteConfig,
} from "@/config/site";

import "./globals.css";

export const metadata:
  Metadata = {
    title: {
      default:
        siteConfig.name,

      template:
        `%s · ${siteConfig.name}`,
    },

    description:
      siteConfig.description,
  }

export const viewport:
  Viewport = {
    width:
      "device-width",

    initialScale: 1,

    viewportFit:
      "cover",

    themeColor:
      "#f5f5f2",
  };

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
