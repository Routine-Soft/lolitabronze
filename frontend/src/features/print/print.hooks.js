import { useState } from "react";
import { testPrinter, printOrder } from "./print.api";

export function usePrint() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [logs, setLogs] = useState([]);

  async function runTestPrint(texto) {
    try {
      setLoading(true);
      setError(null);
      setLogs([]);
      const response = await testPrinter(texto);
      setSuccessMessage(response.message);
      setLogs(response.data?.logs ?? []);
    } catch (err) {
      setError(err);
      setLogs(err.data?.logs ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function printOrderReceipt(orderId) {
    try {
      setLoading(true);
      setError(null);
      setLogs([]);
      const response = await printOrder(orderId);
      setSuccessMessage(response.message);
      setLogs(response.data?.logs ?? []);
    } catch (err) {
      setError(err);
      setLogs(err.data?.logs ?? []);
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, successMessage, logs, runTestPrint, printOrderReceipt };
}