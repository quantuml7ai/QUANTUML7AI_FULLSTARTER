// app/ads/GeoTargetingPicker.jsx

'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { countries } from '@/lib/geo/countries'
import { regions as regionsByCountry } from '@/lib/geo/regions'
import { useI18n } from '../../components/i18n'
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
  variant = 'inline',
  selectedCountries,
  selectedRegions,
  remaining,
  onSelectionChange,
}) {
  const { t, lang } = useI18n()
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
    <div className={`ads-geo-picker ${variant === 'portal' ? 'is-portal' : ''}`}>
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
            <div key={code} className={`ads-geo-country ${isChecked ? 'is-selected' : ''}`}>
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

        .ads-geo-picker.is-portal {
          height: 100%;
          min-height: 0;
          margin: 0;
          padding: 10px 0 10px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .ads-geo-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .is-portal .ads-geo-header {
          margin: 0 2px 10px;
          padding: 8px 9px;
          align-items: center;
          border: 1px solid rgba(91, 213, 255, 0.18);
          border-radius: 14px;
          background:
            linear-gradient(100deg, rgba(45, 183, 229, 0.09), rgba(255, 214, 72, 0.045)),
            rgba(2, 13, 27, 0.48);
        }

        .ads-geo-title {
          margin: 0 0 4px;
          font-size: 18px;
        }

        .is-portal .ads-geo-title,
        .is-portal .ads-geo-sub {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
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

        .is-portal .ads-geo-actions {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, auto));
          justify-content: end;
        }

        .is-portal :global(.btn.ghost) {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 11px;
          border: 1px solid rgba(87, 215, 255, 0.38);
          color: #dff8ff;
          background: rgba(15, 55, 79, 0.62);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
        }

        .is-portal :global(.btn.ghost:hover) {
          border-color: rgba(109, 231, 255, 0.76);
          background: rgba(20, 76, 105, 0.78);
        }

        .ads-geo-metrics {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .is-portal .ads-geo-metrics {
          margin: 0 2px 10px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0;
          overflow: hidden;
          border: 1px solid rgba(95, 219, 255, 0.27);
          border-radius: 17px;
          background:
            radial-gradient(circle at 8% 0, rgba(64, 210, 255, 0.15), transparent 34%),
            radial-gradient(circle at 92% 100%, rgba(255, 218, 69, 0.1), transparent 36%),
            linear-gradient(100deg, rgba(4, 25, 42, 0.94), rgba(10, 22, 33, 0.93));
          box-shadow:
            0 14px 34px rgba(0,0,0,.22),
            inset 0 0 0 1px rgba(255,255,255,.025);
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

        .is-portal .ads-geo-metric {
          position: relative;
          min-width: 0;
          min-height: 62px;
          padding: 11px 13px;
          border-radius: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          background: transparent;
        }

        .is-portal .ads-geo-metric:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 9px;
          right: 0;
          width: 1px;
          height: calc(100% - 18px);
          background: linear-gradient(180deg, transparent, rgba(98, 215, 255, 0.46), transparent);
        }

        :global([dir='rtl']) .is-portal .ads-geo-metric:not(:last-child)::after {
          right: auto;
          left: 0;
        }

        .ads-geo-metric span {
          min-width: 0;
          color: rgba(222, 243, 255, 0.7);
        }

        .is-portal .ads-geo-metric span {
          overflow: visible;
          text-overflow: clip;
          white-space: normal;
          line-height: 1.22;
          font-size: 11px;
        }

        .ads-geo-metric strong {
          font-size: 16px;
        }

        .is-portal .ads-geo-metric strong {
          font-size: 19px;
          color: #fff;
          text-align: end;
          text-shadow: 0 0 14px rgba(71, 207, 255, 0.38);
        }

        .ads-geo-warning {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(255, 92, 92, 0.14);
          color: #ffb2b2;
          font-size: 13px;
        }

        .is-portal .ads-geo-warning {
          margin: 0 4px 10px;
          border: 1px solid rgba(255, 104, 118, 0.34);
          background: rgba(101, 16, 31, 0.46);
        }

        .ads-geo-list {
          margin-top: 16px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 14, 24, 0.55);
          max-height: 520px;
          overflow-y: auto;
        }

        .is-portal .ads-geo-list {
          min-height: 0;
          height: auto;
          flex: 1 1 0;
          margin: 0 4px;
          border-radius: 17px;
          border-color: rgba(94, 204, 248, 0.23);
          background:
            radial-gradient(circle at 15% 0, rgba(47, 177, 225, 0.1), transparent 28%),
            rgba(2, 11, 22, 0.72);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24) inset;
          scrollbar-color: rgba(112, 220, 255, 0.56) rgba(255, 255, 255, 0.04);
        }

        .ads-geo-search {
          position: sticky;
          top: 0;
          padding: 10px;
          background: rgba(10, 14, 24, 0.9);
          z-index: 2;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .is-portal .ads-geo-search {
          padding: 11px;
          background: rgba(4, 16, 29, 0.94);
          backdrop-filter: blur(12px);
        }

        .ads-geo-search input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .is-portal .ads-geo-search input {
          min-height: 42px;
          border-color: rgba(91, 209, 255, 0.34);
          background: rgba(2, 9, 21, 0.72);
          box-shadow: 0 0 0 1px rgba(255,255,255,.025) inset;
        }

        .is-portal .ads-geo-search input:focus {
          outline: none;
          border-color: rgba(93, 234, 255, 0.82);
          box-shadow: 0 0 0 3px rgba(65, 203, 255, 0.12);
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

        .is-portal .ads-geo-country {
          margin: 7px 9px;
          padding: 7px 9px;
          border: 1px solid rgba(109, 196, 235, 0.12);
          border-radius: 13px;
          background: linear-gradient(90deg, rgba(255,255,255,.035), rgba(255,255,255,.015));
          transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
        }

        .is-portal .ads-geo-country:hover {
          transform: translateY(-1px);
          border-color: rgba(87, 215, 255, 0.34);
        }

        .is-portal .ads-geo-country.is-selected {
          border-color: rgba(87, 226, 255, 0.58);
          background:
            linear-gradient(90deg, rgba(42, 185, 228, 0.2), rgba(255, 211, 64, 0.08)),
            rgba(255,255,255,.025);
          box-shadow: 0 0 24px rgba(40, 187, 234, 0.1);
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

        .is-portal .ads-geo-country-main input {
          appearance: none;
          width: 21px;
          height: 21px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(120, 222, 255, 0.5);
          border-radius: 7px;
          background: rgba(3, 14, 27, 0.86);
        }

        .is-portal .ads-geo-country-main input::before {
          content: '';
          width: 10px;
          height: 6px;
          border-left: 2px solid #07111c;
          border-bottom: 2px solid #07111c;
          transform: rotate(-45deg) scale(0);
          transition: transform 120ms ease;
        }

        .is-portal .ads-geo-country-main input:checked {
          border-color: #7ff5ff;
          background: linear-gradient(135deg, #55ecff, #ffe15b);
          box-shadow: 0 0 16px rgba(87, 224, 255, 0.36);
        }

        .is-portal .ads-geo-country-main input:checked::before {
          transform: rotate(-45deg) scale(1);
        }

        .ads-geo-country-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
        }

        .is-portal .ads-geo-country-name {
          font-weight: 720;
          letter-spacing: 0.01em;
        }

        .ads-geo-country-code {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .is-portal .ads-geo-country-code {
          min-width: 34px;
          padding: 3px 7px;
          border-radius: 8px;
          color: #9cecff;
          text-align: center;
          background: rgba(57, 178, 225, 0.11);
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

        :global([dir='rtl']) .ads-geo-region-toggle {
          margin-right: 32px;
          margin-left: 0;
        }

        .is-portal .ads-geo-region-toggle {
          margin-top: 2px;
          color: #8feaff;
          font-weight: 700;
        }

        .ads-geo-regions {
          margin: 8px 0 0 32px;
          padding: 10px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
        }

        :global([dir='rtl']) .ads-geo-regions {
          margin-right: 32px;
          margin-left: 0;
        }

        .is-portal .ads-geo-regions {
          border-color: rgba(97, 216, 255, 0.2);
          background: rgba(4, 21, 35, 0.7);
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
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
        }

        .ads-geo-region-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 8px;
          align-items: center;
          min-width: 0;
          cursor: pointer;
          padding: 6px 7px;
          border-radius: 9px;
          background: rgba(255,255,255,.025);
        }

        .ads-geo-region-row:hover {
          background: rgba(72, 192, 232, 0.1);
        }

        .ads-geo-region-row input {
          width: 16px;
          height: 16px;
          accent-color: #7bc5ff;
        }

        .ads-geo-region-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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

          .ads-geo-picker.is-portal {
            padding: 7px 0;
          }

          .is-portal .ads-geo-header {
            flex: 0 0 auto;
            margin-inline: 1px;
            padding: 7px;
          }

          .is-portal .ads-geo-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            justify-content: stretch;
          }

          .is-portal :global(.btn.ghost) {
            width: 100%;
            padding-inline: 8px;
            font-size: 12px;
          }

          .is-portal .ads-geo-metrics {
            position: relative;
            flex: 0 0 auto;
            min-height: 100px;
            max-height: none;
            margin-inline: 1px;
            overflow: visible;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-auto-rows: minmax(50px, auto);
          }

          .is-portal .ads-geo-metrics::after {
            content: '';
            position: absolute;
            z-index: 2;
            top: 50%;
            left: 10px;
            right: 10px;
            height: 1px;
            pointer-events: none;
            background: linear-gradient(90deg, transparent, rgba(255, 218, 67, .92), transparent);
            box-shadow: 0 0 10px rgba(255, 214, 56, .34);
          }

          .is-portal .ads-geo-metric {
            min-height: 50px;
            padding: 7px 9px;
          }

          .is-portal .ads-geo-metric:nth-child(2)::after {
            display: none;
          }


          .ads-geo-list,
          .is-portal .ads-geo-list {
            max-height: none;
            margin-inline: 2px;
          }

          .is-portal .ads-geo-country {
            margin: 6px;
          }

          .ads-geo-regions-list {
            grid-template-columns: 1fr;
          }

          .ads-geo-regions,
          :global([dir='rtl']) .ads-geo-regions {
            margin-left: 0;
            margin-right: 0;
          }

          .ads-geo-region-toggle,
          :global([dir='rtl']) .ads-geo-region-toggle {
            margin-left: 0;
            margin-right: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .is-portal .ads-geo-country {
            transition: none;
          }
        }
      `}</style>
    </div>
  )
}
