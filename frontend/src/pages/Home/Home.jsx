import OrderADM from "@/features/order/components/orderADM";
import CashRecepcionista from "@/features/cash/components/cashRecepcionista";
import RelatorioRecepcionista from "@/features/relatorio/components/relatorioRecepcionista";
import CustomerADM from "@/features/customer/components/customerADM";
import "./Home.css"; // Importe seu arquivo CSS

export default function Home() {
  return (
    <div className="home-container">
      <h1 className="home-title">Dashborad</h1>

      {/* Componente no Topo */}
      <div className="top-section">
        <OrderADM />
      </div>

      {/* Container Lado a Lado */}
      <div className="bottom-grid">
        <CashRecepcionista />
        <RelatorioRecepcionista />
        <CustomerADM />
      </div>
    </div>
  );
}