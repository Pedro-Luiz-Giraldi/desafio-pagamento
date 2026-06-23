import { Navigate, useParams } from 'react-router-dom'
import { ROUTES } from '@lib/constants'

export default function RefundPage() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={ROUTES.TRANSACTION_DETAIL.replace(':id', id ?? '')} replace />
}
