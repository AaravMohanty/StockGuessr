import { useState, useEffect } from "react";

interface ShareInputProps {
    price: number;
    maxCapital: number;
    onChange: (shares: number) => void;
    disabled?: boolean;
}

export default function ShareInput({ price, maxCapital, onChange, disabled }: ShareInputProps) {
    const maxShares = Math.floor(maxCapital / price);
    const [shares, setShares] = useState(0);

    useEffect(() => {
        // Reset shares when price or maxCapital changes significantly (new round)
        setShares(0);
        onChange(0);
    }, [price, maxCapital]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setShares(val);
        onChange(val);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        if (val > maxShares) val = maxShares;
        setShares(val);
        onChange(val);
    };

    const totalCost = shares * price;

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Max Shares: {maxShares}</span>
                <span>Cost: ${totalCost.toLocaleString()}</span>
            </div>

            <div className="flex gap-4 items-center">
                <input
                    type="range"
                    min="0"
                    max={maxShares}
                    value={shares}
                    onChange={handleSliderChange}
                    disabled={disabled}
                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <input
                    type="number"
                    min="0"
                    max={maxShares}
                    value={shares}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-right text-white focus:outline-none focus:border-purple-500"
                />
            </div>

            <div className="flex justify-between gap-2">
                {[0.25, 0.5, 0.75, 1].map((percent) => (
                    <button
                        key={percent}
                        onClick={() => {
                            const val = Math.floor(maxShares * percent);
                            setShares(val);
                            onChange(val);
                        }}
                        disabled={disabled}
                        className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                    >
                        {percent * 100}%
                    </button>
                ))}
            </div>
        </div>
    );
}
