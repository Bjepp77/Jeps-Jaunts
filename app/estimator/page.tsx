import { createSupabaseServer } from "@/src/lib/supabase-server"
import { EstimatorPage } from "@/src/components/Estimator/EstimatorPage"

export const metadata = {
  title: "Wedding Flowers Estimator",
  description: "Get an instant estimate for your wedding flowers.",
}

export default async function EstimatorRoute() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <EstimatorPage isSignedIn={!!user} />
}
