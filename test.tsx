import React, { useState } from "react";
import { useHydra } from "./src";

const HydraProviderExample = () => {
  const [url, setHydraUrl] = useState("");

  const { hydra, status, message } = useHydra({
    httpUrl: url
  });

  const handleInit = () => {
    // Start the connection
    const sub = hydra.connect().subscribe({
      next(msg) {
        console.log("Hydra connected message:", msg);
      },
      error(err) {
        console.error("Hydra connection error:", err);
      }
    });

    hydra.init();

    hydra.newTx({
      type: "Tx ConwayEra",
      description: "",
      cborHex: "0x00"
    }).subscribe({
      next(msg) {
        console.log("Hydra newTx message:", msg);
      },
      error(err) {
        console.error("Hydra newTx error:", err);
      }
    });
    if (message?.tag === "TxValid") {
      hydra.decommit({
        type: "Tx ConwayEra",
        description: "",
        cborHex: "0x00"
      }).subscribe({
        next(msg) {
          console.log("Hydra decommit message:", msg);
        },
      });
    }
    hydra.close().subscribe({
      next(msg) {
        console.log("Hydra close message:", msg);
      },
      error(err) {
        console.error("Hydra close error:", err);
      }
    });
  };

  return (
    <div>
      <button onClick={handleInit}>Init Hydra</button>

      <div>Status: {status}</div>
      <div>Message: {message?.tag}</div>

      <input
        type="text"
        placeholder="http://localhost:4001"
        value={url}
        onChange={(e) => setHydraUrl(e.target.value)}
      />
    </div>
  );
};

export default HydraProviderExample;
