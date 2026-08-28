import { useState } from "react";
import { testPrinter, printOrder } from "./print.api";

export function usePrint() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  async function runTestPrint(texto) {
    try {
      setLoading(true);
      setError(null);
      const response = await testPrinter(texto);
      setSuccessMessage(response.message);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function printOrderReceipt(orderId) {
    try {
      setLoading(true);
      setError(null);
      const response = await printOrder(orderId);
      setSuccessMessage(response.message);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, successMessage, runTestPrint, printOrderReceipt };
}