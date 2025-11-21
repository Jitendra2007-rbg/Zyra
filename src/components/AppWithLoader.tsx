import { useState, useEffect } from "react";
import ZyraLoader from "./ZyraLoader";

interface AppWithLoaderProps {
    children: React.ReactNode;
    loaderDuration?: number; // Duration in milliseconds
    backgroundColor?: string;
    textColor?: string;
    dotColor?: string;
}

export default function AppWithLoader({
    children,
    loaderDuration = 6000, // Default 6 seconds (full animation cycle)
    backgroundColor = "#ffffff",
    textColor = "#000000",
    dotColor = "#000000",
}: AppWithLoaderProps) {
    const [showLoader, setShowLoader] = useState(true);
    const [hasShownLoader, setHasShownLoader] = useState(false);

    useEffect(() => {
        // Check if loader has already been shown in this session
        const loaderShown = sessionStorage.getItem("zyra-loader-shown");

        if (loaderShown === "true") {
            setShowLoader(false);
            setHasShownLoader(true);
            return;
        }

        // Show loader and hide after duration
        const timer = setTimeout(() => {
            setShowLoader(false);
            sessionStorage.setItem("zyra-loader-shown", "true");
            setHasShownLoader(true);
        }, loaderDuration);

        return () => clearTimeout(timer);
    }, [loaderDuration]);

    if (showLoader || !hasShownLoader) {
        return (
            <ZyraLoader
                backgroundColor={backgroundColor}
                textColor={textColor}
                dotColor={dotColor}
            />
        );
    }

    return <>{children}</>;
}
