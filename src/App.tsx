import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"
import { useCustomFetch } from "./hooks/useCustomFetch"

export function App() {
   
  const {clearCache} = useCustomFetch()
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [numPerPage, setNumPerPage] = useState<number>(5)
  const [showButton, setShowButton] = useState<boolean>(true)


  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )


  

  const loadAllTransactions = useCallback(async (numTransactions: number | null) => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll(numTransactions, false)
    
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll(numTransactions, false)

    
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  useEffect(() => {
    if (paginatedTransactions !== null) {
      if (paginatedTransactions.nextPage === null) {
        setShowButton(false)
      } else {
        setShowButton(true)
      }
    }
  }, [paginatedTransactions])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      transactionsByEmployeeUtils.invalidateData()
      setShowButton(false)
      setIsLoading(true)
      await transactionsByEmployeeUtils.fetchById(employeeId, false)
      setIsLoading(false)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions(numPerPage)
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }
            if (newValue.id === "") {
              await loadAllTransactions(5)
              setNumPerPage(5)
              return;
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions 
          transactions={transactions} 
          clearCache={clearCache}/>

          {transactions !== null && showButton && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions(numPerPage + 5)
                setNumPerPage(numPerPage+5)
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
