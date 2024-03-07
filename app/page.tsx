"use client";

import { AlgorithmDataContextProvider } from '@/contexts/AlgorithmDataContext';
import {Root} from "@/components/Root/Root";

export default function HomePage() {
  return (
    <>
        <AlgorithmDataContextProvider>
            <Root />
        </AlgorithmDataContextProvider>
    </>
  );
}
