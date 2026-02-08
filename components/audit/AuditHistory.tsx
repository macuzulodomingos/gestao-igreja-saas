export function AuditHistory({ logs }: { logs: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Linha do Tempo de Alterações</h3>
      
      <div className="flex flex-col gap-4">
        {logs.length === 0 && (
          <p className="text-gray-500 text-sm italic">Nenhuma alteração registada.</p>
        )}

        {logs.map((log) => (
          <div key={log.id} className="p-4 bg-white border rounded-lg shadow-sm text-sm">
            {/* Cabeçalho do Log */}
            <div className="flex justify-between items-center mb-3">
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                log.action === 'CREATE_MEMBER' ? 'bg-green-100 text-green-700' :
                log.action === 'DELETE_MEMBER' ? 'bg-red-100 text-red-700' : 
                'bg-blue-100 text-blue-700'
              }`}>
                {log.action.replace('_', ' ')}
              </span>
              <span className="text-gray-400 text-xs italic">
                {new Date(log.createdAt).toLocaleString('pt-PT')}
              </span>
            </div>
            
            <p className="text-gray-600 mb-3 italic">
              Por: <span className="font-semibold text-gray-800">{log.userEmail}</span>
            </p>

            {/* A parte que você perguntou: O Comparador de Dados */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md border border-gray-100">
              {/* Coluna do "ANTES" (Vermelho) */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Anterior</p>
                {log.oldData ? Object.entries(log.oldData as object).map(([key, value]) => (
                  <div key={key} className="flex flex-col border-b border-gray-200 pb-1">
                    <span className="text-[10px] text-gray-400 uppercase">{key}</span>
                    <span className="text-red-500 break-all">{String(value || '---')}</span>
                  </div>
                )) : <p className="text-gray-300 italic">N/A</p>}
              </div>

              {/* Coluna do "DEPOIS" (Verde) */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Atualizado</p>
                {log.newData ? Object.entries(log.newData as object).map(([key, value]) => (
                  <div key={key} className="flex flex-col border-b border-gray-200 pb-1">
                    <span className="text-[10px] text-gray-400 uppercase">{key}</span>
                    <span className="text-green-600 break-all">{String(value || '---')}</span>
                  </div>
                )) : <p className="text-gray-300 italic">N/A</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}