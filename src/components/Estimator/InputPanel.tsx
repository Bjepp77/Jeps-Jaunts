import type { EstimatorInputs, EstimatorAction, CeremonyTier, ReceptionTier } from "@/src/lib/pricing/types"
import { CEREMONY_TIER_LABELS, RECEPTION_TIER_LABELS } from "@/src/lib/pricing/types"
import { SliderField } from "./controls/SliderField"
import { SelectField } from "./controls/SelectField"

const CEREMONY_OPTIONS = (
  Object.entries(CEREMONY_TIER_LABELS) as [CeremonyTier, string][]
).map(([value, label]) => ({ value, label }))

const RECEPTION_OPTIONS = (
  Object.entries(RECEPTION_TIER_LABELS) as [ReceptionTier, string][]
).map(([value, label]) => ({ value, label }))

interface InputPanelProps {
  inputs: EstimatorInputs
  dispatch: React.Dispatch<EstimatorAction>
}

export function InputPanel({ inputs, dispatch }: InputPanelProps) {
  return (
    <section aria-label="Estimator controls">
      <div className="divide-y divide-hairline">

        <div className="pb-10">
          <SliderField
            id="wedding-party-pairs"
            label="Wedding Party Flowers"
            value={inputs.weddingPartyPairs}
            min={0}
            max={15}
            valueLabel={(v) => (v === 0 ? "None" : `${v} pair${v !== 1 ? "s" : ""}`)}
            helperText="Each pair includes one bridal bouquet and one boutonniere. Adjust to match your wedding party size."
            onChange={(v) => dispatch({ type: "SET_WEDDING_PARTY_PAIRS", payload: v })}
          />
        </div>

        <div className="py-10">
          <SelectField<CeremonyTier>
            id="ceremony-tier"
            label="Ceremony Flowers"
            value={inputs.ceremonyTier}
            options={CEREMONY_OPTIONS}
            helperText="From a simple arch accent to a fully designed ceremony space. Choose 'Skip' if you're not decorating the ceremony."
            onChange={(v) => dispatch({ type: "SET_CEREMONY_TIER", payload: v })}
          />
        </div>

        <div className="py-10">
          <SliderField
            id="guest-count"
            label="Number of Guests"
            value={inputs.guestCount}
            min={10}
            max={250}
            step={5}
            valueLabel={(v) => `${v} guests`}
            helperText="We estimate one table per 8 guests to calculate reception flower quantities."
            onChange={(v) => dispatch({ type: "SET_GUEST_COUNT", payload: v })}
          />
        </div>

        <div className="pt-10">
          <SelectField<ReceptionTier>
            id="reception-tier"
            label="Reception Flowers"
            value={inputs.receptionTier}
            options={RECEPTION_OPTIONS}
            helperText="Priced per table. Micro bud vases are elegant and budget-friendly; lush centerpieces make a dramatic statement."
            onChange={(v) => dispatch({ type: "SET_RECEPTION_TIER", payload: v })}
          />
        </div>

      </div>
    </section>
  )
}
