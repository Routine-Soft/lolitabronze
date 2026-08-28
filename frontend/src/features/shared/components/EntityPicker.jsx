export default function EntityPicker({
  items,
  loading,
  search,
  onSearchChange,
  page,
  totalPages,
  onPageChange,
  selectedId,
  onSelect,
  renderLabel,
  placeholder = 'Buscar...',
}) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '8px', marginBottom: '8px' }}>
      <input
        style={{padding: '6px', borderRadius: '5px', width: '50%', marginBottom: '8px'}}
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
      />

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div>
          {items.map((item) => (
            <div key={item.id}>
              <label>
                <input
                  type="radio"
                  checked={selectedId === item.id}
                  onChange={() => onSelect(item.id)}
                />
                {renderLabel(item)}
              </label>
            </div>
          ))}
          {items.length === 0 && <div>Nenhum resultado</div>}
        </div>
      )}

      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Anterior
      </button>
      <span> Página {page} de {totalPages} </span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Próxima
      </button>
    </div>
  );
}