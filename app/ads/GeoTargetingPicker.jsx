// app/ads/GeoTargetingPicker.jsx

'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { countries } from '@/lib/geo/countries'
import { regions as regionsByCountry } from '@/lib/geo/regions'

const tx = (t, key, fb) => {
  try {
    const v = t?.(key)
    if (!v || v === key) return fb
    return v
  } catch {
    return fb
  }
}

function clampRemaining(value) {
  if (value == null) return null
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return Math.max(0, Math.floor(num))
}

export default function GeoTargetingPicker({
  t,
  lang,
  selectedCountries,
  selectedRegions,
  remaining,
  onSelectionChange,
}) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(() => new Set())
  const [limitNotice, setLimitNotice] = useState('')

  const remainingValue = clampRemaining(remaining)
  const remainingSlots = remainingValue == null ? Infinity : remainingValue

  const selectedSet = useMemo(() => {
    return new Set(
      (Array.isArray(selectedCountries) ? selectedCountries : []).map((c) =>
        String(c || '').toUpperCase(),
      ),
    )
  }, [selectedCountries])
  const displayNames = useMemo(() => {
    if (typeof Intl === 'undefined' || !lang) return null
    try {
      return new Intl.DisplayNames([lang], { type: 'region' })
    } catch {
      return null
    }
  }, [lang])
  const getCountryLabel = useCallback(
    (country) => {
      const code = String(country.code || '').toUpperCase()
      const localized = displayNames?.of(code)
      if (localized && localized !== code) return localized
      const key = `country_${code.toLowerCase()}`
      const fallback = country.name_en
      return tx(t, key, fallback)
    },
    [displayNames, t],
  )

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase()
    const list = countries
      .map((country) => ({
        ...country,
        label: getCountryLabel(country),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    if (!query) return list

    return list.filter((country) => {
      return (
        country.label.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query)
      )
    })
  }, [search, getCountryLabel])

  const selectedCount = selectedSet.size
  const spendCount = selectedCount
  const remainingAfter =
    remainingSlots === Infinity
      ? Infinity
      : Math.max(0, remainingSlots - spendCount)

  const limitExceeded =
    remainingSlots !== Infinity && spendCount > remainingSlots

  useEffect(() => {
    if (!limitExceeded) return
    setLimitNotice(tx(t, 'ads_geo_limit_exceeded', 'Not enough campaigns.'))
  }, [limitExceeded, t])

  const updateSelection = (nextCountries, nextRegions) => {
    onSelectionChange?.({
      countries: nextCountries,
      regions: nextRegions,
    })
  }

  const handleToggleCountry = (code) => {
    const upper = String(code || '').toUpperCase()
    if (!upper) return
    setLimitNotice('')

    if (selectedSet.has(upper)) {
      const nextCountries = (selectedCountries || [])
        .map((c) => String(c || '').toUpperCase())
        .filter((c) => c && c !== upper)

      const nextRegions = { ...(selectedRegions || {}) }
      delete nextRegions[upper]
      updateSelection(nextCountries, nextRegions)
      return
    }

    if (selectedCount >= remainingSlots) {
      const remainingLabel =
        remainingSlots === Infinity ? '∞' : String(remainingSlots)
      setLimitNotice(
        tx(
          t,
          'ads_geo_limit_blocked',
          `You can select no more than ${remainingLabel} countries.`,
        ).replace('{remaining}', remainingLabel),
      )
      return
    }

    const nextCountries = Array.from(
      new Set([
        ...(selectedCountries || []).map((c) => String(c || '').toUpperCase()),
        upper,
      ]),
    )

    updateSelection(nextCountries, { ...(selectedRegions || {}) })
  }

  const handleSelectAllFiltered = () => {
    setLimitNotice('')

    const filteredCodes = filteredCountries.map((c) => c.code)
    const candidates = filteredCodes.filter((code) => !selectedSet.has(code))

    if (!candidates.length) return

    if (remainingSlots === Infinity) {
      const nextCountries = Array.from(
        new Set([
          ...(selectedCountries || []).map((c) => String(c || '').toUpperCase()),
          ...candidates,
        ]),
      )
      updateSelection(nextCountries, { ...(selectedRegions || {}) })
      return
    }

    const available = Math.max(0, remainingSlots - selectedCount)
    if (available <= 0) {
      setLimitNotice(tx(t, 'ads_geo_limit_exceeded', 'Not enough campaigns.'))
      return
    }

    const toAdd = candidates.slice(0, available)
    const nextCountries = Array.from(
      new Set([
        ...(selectedCountries || []).map((c) => String(c || '').toUpperCase()),
        ...toAdd,
      ]),
    )

    if (toAdd.length < candidates.length) {
      const message = tx(
        t,
        'ads_geo_limit_capped_selected',
        `Selected only {selected} of {total} — package limit.`,
      )
        .replace('{selected}', String(toAdd.length))
        .replace('{total}', String(candidates.length))
      setLimitNotice(message)
    }

    updateSelection(nextCountries, { ...(selectedRegions || {}) })
  }

  const handleClear = () => {
    setLimitNotice('')
    updateSelection([], {})
  }

  const handleToggleRegion = (countryCode, regionCode) => {
    const country = String(countryCode || '').toUpperCase()
    const region = String(regionCode || '').toUpperCase()
    if (!country || !region) return

    const current = Array.isArray(selectedRegions?.[country])
      ? selectedRegions[country]
      : []

    const next = current.includes(region)
      ? current.filter((r) => r !== region)
      : [...current, region]

    const nextRegions = {
      ...(selectedRegions || {}),
      [country]: next,
    }

    updateSelection(Array.from(selectedSet), nextRegions)
  }

  const handleSelectAllRegions = (countryCode) => {
    const country = String(countryCode || '').toUpperCase()
    const list = regionsByCountry[country] || []
    const allCodes = list.map((r) => String(r.code || '').toUpperCase())

    const nextRegions = {
      ...(selectedRegions || {}),
      [country]: Array.from(new Set(allCodes)),
    }

    updateSelection(Array.from(selectedSet), nextRegions)
  }

  const handleClearRegions = (countryCode) => {
    const country = String(countryCode || '').toUpperCase()
    const nextRegions = { ...(selectedRegions || {}) }
    delete nextRegions[country]
    updateSelection(Array.from(selectedSet), nextRegions)
  }

  const toggleExpand = (code) => {
    const upper = String(code || '').toUpperCase()
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(upper)) {
        next.delete(upper)
      } else {
        next.add(upper)
      }
      return next
    })
  }

  return (
    <div className="ads-geo-picker">
      <div className="ads-geo-header">
        <div>
          <h3 className="ads-geo-title">
            {tx(t, 'ads_geo_targeting_title', 'Where to show ads')}
          </h3>
          <p className="ads-geo-sub">
            {tx(
              t,
              'ads_geo_targeting_sub',
              'Select the countries and (optionally) regions for your campaign.',
            )}
          </p>
        </div>
        <div className="ads-geo-actions">
          <button type="button" className="btn ghost" onClick={handleClear}>
            {tx(t, 'ads_geo_clear', 'Clear')}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={handleSelectAllFiltered}
          >
            {tx(t, 'ads_geo_select_all_filtered', 'Select all found')}
          </button>
        </div>
      </div>

      <div className="ads-geo-metrics">
        <div className="ads-geo-metric">
          <span>{tx(t, 'ads_geo_selected_count', 'Countries selected')}</span>
          <strong>{selectedCount}</strong>
        </div>
        <div className="ads-geo-metric">
          <span>{tx(t, 'ads_geo_spend_count', 'Campaigns to spend')}</span>
          <strong>{spendCount}</strong>
        </div>
        <div className="ads-geo-metric">
          <span>{tx(t, 'ads_geo_available', 'Available in package')}</span>
          <strong>
            {remainingValue == null ? '∞' : String(remainingValue)}
          </strong>
        </div>
        <div className="ads-geo-metric">
          <span>
            {tx(t, 'ads_geo_remaining_after', 'Remaining after launch')}
          </span>
          <strong>{remainingAfter === Infinity ? '∞' : remainingAfter}</strong>
        </div>
      </div>

      {(limitNotice || limitExceeded) && (
        <div className="ads-geo-warning">
          {limitNotice ||
            tx(t, 'ads_geo_limit_exceeded', 'Not enough campaigns.')}
        </div>
      )}

      <div className="ads-geo-list">
        <div className="ads-geo-search">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx(
              t,
              'ads_geo_search_placeholder',
              'Search country or code',
            )}
          />
        </div>

        {filteredCountries.length === 0 && (
          <div className="ads-geo-empty">
            {tx(t, 'ads_geo_no_results', 'No matching countries')}
          </div>
        )}

        {filteredCountries.map((country) => {
          const code = country.code
          const label = country.label
          const isChecked = selectedSet.has(code)
          const regions = regionsByCountry[code] || []
          const isExpanded = expanded.has(code)
          const selectedRegionCodes = new Set(
            (selectedRegions?.[code] || []).map((r) =>
              String(r || '').toUpperCase(),
            ),
          )

          return (
            <div key={code} className="ads-geo-country">
              <label className="ads-geo-country-main">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleCountry(code)}
                />
                <span className="ads-geo-country-name">{label}</span>
                <span className="ads-geo-country-code">{code}</span>
              </label>
              {regions.length > 0 && isChecked && (
                <button
                  type="button"
                  className="ads-geo-region-toggle"
                  onClick={() => toggleExpand(code)}
                >
                  {isExpanded
                    ? tx(t, 'ads_geo_regions_toggle_hide', 'Hide regions')
                    : tx(t, 'ads_geo_regions_toggle_show', 'Show regions')}
                </button>
              )}

              {regions.length > 0 && isChecked && isExpanded && (
                <div className="ads-geo-regions">
                  <div className="ads-geo-regions-header">
                    <span>{tx(t, 'ads_geo_regions_label', 'Regions')}</span>
                    <div className="ads-geo-regions-actions">
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => handleSelectAllRegions(code)}
                      >
                        {tx(
                          t,
                          'ads_geo_regions_select_all',
                          'Select all regions',
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => handleClearRegions(code)}
                      >
                        {tx(t, 'ads_geo_regions_clear', 'Clear regions')}
                      </button>
                    </div>
                  </div>
                  <div className="ads-geo-regions-list">
                    {regions.map((region) => {
                      const regionCode = String(region.code || '').toUpperCase()
                      const checked = selectedRegionCodes.has(regionCode)
                      return (
                        <label
                          key={`${code}-${regionCode}`}
                          className="ads-geo-region-row"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              handleToggleRegion(code, regionCode)
                            }
                          />
                          <span className="ads-geo-region-name">
                            {region.name_en}
                          </span>
                          <span className="ads-geo-region-code">
                            {regionCode}
                          </span>
                        </label>
                      )}
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .ads-geo-picker {
          margin-top: 18px;
          padding: 18px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }

        .ads-geo-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ads-geo-title {
          margin: 0 0 4px;
          font-size: 18px;
        }

        .ads-geo-sub {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.65);
        }

        .ads-geo-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ads-geo-metrics {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .ads-geo-metric {
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
        }

        .ads-geo-metric strong {
          font-size: 16px;
        }

        .ads-geo-warning {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(255, 92, 92, 0.14);
          color: #ffb2b2;
          font-size: 13px;
        }

        .ads-geo-list {
          margin-top: 16px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 14, 24, 0.55);
          max-height: 520px;
          overflow-y: auto;
        }

        .ads-geo-search {
          position: sticky;
          top: 0;
          padding: 10px;
          background: rgba(10, 14, 24, 0.9);
          z-index: 2;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .ads-geo-search input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .ads-geo-empty {
          padding: 12px 14px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .ads-geo-country {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .ads-geo-country:last-child {
          border-bottom: none;
        }

        .ads-geo-country-main {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          align-items: center;
          cursor: pointer;
          padding: 8px 6px;
          border-radius: 10px;
        }

        .ads-geo-country-main:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .ads-geo-country-main input {
          width: 18px;
          height: 18px;
          accent-color: #3aa9ff;
        }

        .ads-geo-country-name {
          font-size: 14px;
        }

        .ads-geo-country-code {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .ads-geo-region-toggle {
          margin: 6px 0 0 32px;
          background: transparent;
          border: none;
          color: #7bc5ff;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 0;
        }

        .ads-geo-regions {
          margin: 8px 0 0 32px;
          padding: 10px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
        }

        .ads-geo-regions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .ads-geo-regions-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .ads-geo-regions-list {
          max-height: 200px;
          overflow-y: auto;
          padding-right: 6px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ads-geo-region-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          align-items: center;
          cursor: pointer;
        }

        .ads-geo-region-row input {
          width: 16px;
          height: 16px;
          accent-color: #7bc5ff;
        }

        .ads-geo-region-name {
          font-size: 13px;
        }

        .ads-geo-region-code {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
        }

        @media (max-width: 720px) {
          .ads-geo-picker {
            padding: 14px;
          }
          .ads-geo-list {
            max-height: 480px;
          }
        }
      `}</style>
    </div>
  )
}
