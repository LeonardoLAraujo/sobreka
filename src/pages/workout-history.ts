import {LitElement, html, css, unsafeCSS, nothing, PropertyValues, TemplateResult, CSSResult} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import ApexCharts from 'apexcharts';
import apexChartsCss from 'apexcharts/dist/apexcharts.css?inline';
import type {Exercise, MonthlyWorkouts, WorkoutDay} from '../models/progress';
import {MONTH_NAMES} from '../models/constants';
import {getSessionUserId} from '../models/auth';
import {fetchTrainingProgress} from '../models/trainingProgress';
import {formatDateBR} from '../models/dateFormat';
import AcadMain from '../acad-main';
import '../components/workout-detail-modal';
import '../components/ui-icon';

const SERIES_WEIGHT_PATTERN = /([\d.]+)\s*kg/i;
const SERIES_FULL_PATTERN = /(\d+)\s*reps\s*com\s*([\d.]+)\s*kg/i;

const WEEKDAY_SHORT: Record<string, string> = {
    'Domingo': 'Dom',
    'Segunda-feira': 'Seg',
    'Terça-feira': 'Ter',
    'Quarta-feira': 'Qua',
    'Quinta-feira': 'Qui',
    'Sexta-feira': 'Sex',
    'Sábado': 'Sáb',
};

const WEEKDAY_ORDER = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

interface MonthGroup {
    key: string;
    label: string;
    days: WorkoutDay[];
}

interface DateGroup {
    date: string;
    days: WorkoutDay[];
}

interface AnalysisStats {
    totalTreinos: number;
    totalExercicios: number;
    volumeTotal: number;
    mediaExercicios: number;
    topExercicio: string;
    topDiaSemana: string;
}

type HistoryMode = 'geral' | 'por-data';

@customElement('workout-history')
export default class WorkoutHistory extends LitElement{

    @state() private mode: HistoryMode = 'geral';

    @state() private groups: MonthGroup[] = [];
    @state() private selectedMonthKey: string | null = null;
    @state() private selectedDate: string | null = null;

    @state() private filterYear = 'all';
    @state() private filterMonth = 'all';
    @state() private filterFocus = 'all';

    @state() private detailModalOpen = false;
    @state() private detailDay: WorkoutDay | null = null;

    @query('#evolution-chart') private chartContainer?: HTMLDivElement;
    @query('#monthly-chart') private monthlyChartContainer?: HTMLDivElement;
    @query('#focus-chart') private focusChartContainer?: HTMLDivElement;
    @query('#weekday-chart') private weekdayChartContainer?: HTMLDivElement;

    private chart: ApexCharts | null = null;
    private monthlyChart: ApexCharts | null = null;
    private focusChart: ApexCharts | null = null;
    private weekdayChart: ApexCharts | null = null;

    static override get styles(): CSSResult{
        return css`
            ${unsafeCSS(apexChartsCss)}

            :host {
                display: flex;
                flex-direction: column;
                min-height: 100%;
                background: #1B1E22;
                color: #ECEAE3;
            }

            header {
                background: #23262B;
                border-bottom: 1px solid #33383F;
                padding: 16px;
                box-sizing: border-box;
            }

            .header-inner {
                max-width: 960px;
                margin: 0 auto;
            }

            header h1 {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                color: #fff;
            }

            header p {
                margin: 2px 0 0;
                font-size: 11px;
                color: #8A9099;
            }

            @media (min-width: 640px) {
                header h1 {
                    font-size: 20px;
                }

                header p {
                    font-size: 12px;
                }
            }

            main {
                flex: 1;
                max-width: 960px;
                width: 100%;
                margin: 0 auto;
                padding: 16px 12px;
                box-sizing: border-box;
            }

            @media (min-width: 640px) {
                main {
                    padding: 24px 16px;
                }
            }

            .tabs {
                display: flex;
                gap: 4px;
                background: #23262B;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 4px;
                margin-bottom: 16px;
            }

            .tab {
                flex: 1;
                background: none;
                border: none;
                color: #8A9099;
                font-size: 13px;
                font-weight: 600;
                padding: 8px 12px;
                border-radius: 8px;
                cursor: pointer;
                font-family: inherit;
            }

            .tab:hover {
                color: #ECEAE3;
            }

            .tab.active {
                background: #C8102E;
                color: #fff;
            }

            .filter-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 16px;
            }

            .filter-row select {
                background: #23262B;
                border: 1px solid #33383F;
                color: #ECEAE3;
                font: inherit;
                font-size: 12px;
                font-weight: 600;
                padding: 8px 10px;
                border-radius: 10px;
                cursor: pointer;
            }

            .filter-row select:focus {
                outline: none;
                border-color: #E8354F;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                margin-bottom: 16px;
            }

            @media (min-width: 640px) {
                .stats-grid {
                    grid-template-columns: repeat(3, 1fr);
                }
            }

            .stat-tile {
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 14px;
                padding: 14px;
                box-sizing: border-box;
            }

            .stat-tile ui-icon {
                color: #E8354F;
                margin-bottom: 6px;
            }

            .stat-value {
                font-size: 18px;
                font-weight: 700;
                color: #E8354F;
                overflow-wrap: break-word;
            }

            .stat-label {
                margin-top: 2px;
                font-size: 11px;
                color: #6E757E;
            }

            .chart-card {
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 16px;
                padding: 16px;
                margin-bottom: 16px;
                box-sizing: border-box;
            }

            .chart-title {
                margin: 0 0 4px;
                font-size: 14px;
                font-weight: 700;
                color: #fff;
            }

            .chart-subtitle {
                margin: 0 0 12px;
                font-size: 12px;
                color: #6E757E;
            }

            .chart-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 16px;
                margin-bottom: 16px;
            }

            @media (min-width: 768px) {
                .chart-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }

            .chart-grid .chart-card {
                margin-bottom: 0;
            }

            .no-chart-data {
                margin: 0;
                font-size: 12px;
                font-style: italic;
                color: #475569;
            }

            .list {
                display: grid;
                gap: 12px;
            }

            .month-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                width: 100%;
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 16px;
                text-align: left;
                cursor: pointer;
                font: inherit;
                color: inherit;
            }

            .month-item:hover {
                border-color: #4E555D;
            }

            .month-item-label {
                font-size: 15px;
                font-weight: 600;
                color: #fff;
            }

            .month-item-description {
                font-size: 12px;
                color: #6E757E;
                margin-top: 2px;
            }

            .month-item ui-icon {
                color: #E8354F;
                flex-shrink: 0;
            }

            .days-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
            }

            .back-link {
                display: flex;
                align-items: center;
                gap: 4px;
                background: none;
                border: none;
                color: #8A9099;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                padding: 6px 8px;
                margin: -6px 0 -6px -8px;
                border-radius: 8px;
                font-family: inherit;
                flex-shrink: 0;
            }

            .back-link:hover {
                color: #ECEAE3;
                background: #33383F;
            }

            .days-header h2 {
                margin: 0;
                font-size: 16px;
                font-weight: 700;
                color: #fff;
            }

            .day-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                width: 100%;
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 16px;
                text-align: left;
                cursor: pointer;
                font: inherit;
                color: inherit;
            }

            .day-item:hover {
                border-color: #4E555D;
            }

            .day-item ui-icon.arrow {
                color: #E8354F;
                flex-shrink: 0;
            }

            .day-item-top {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }

            .day-badge {
                background: rgba(200, 16, 46, 0.1);
                color: #E8354F;
                border: 1px solid rgba(200, 16, 46, 0.2);
                font-size: 11px;
                font-weight: 600;
                padding: 3px 8px;
                border-radius: 8px;
            }

            .day-date {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: #8A9099;
            }

            .day-item-label {
                font-size: 15px;
                font-weight: 600;
                color: #fff;
            }

            .day-item-description {
                font-size: 12px;
                color: #6E757E;
                margin-top: 2px;
            }

            .empty-state {
                text-align: center;
                padding: 40px 20px;
                background: rgba(35, 38, 43, 0.5);
                border: 1px solid rgba(51, 56, 63, 0.8);
                border-radius: 16px;
                box-sizing: border-box;
            }

            @media (min-width: 480px) {
                .empty-state {
                    padding: 64px 32px;
                }
            }

            .empty-icon {
                width: 64px;
                height: 64px;
                border-radius: 999px;
                background: #33383F;
                color: #6E757E;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
            }

            .empty-state h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #ECEAE3;
            }

            .empty-state p {
                max-width: 22rem;
                margin: 4px auto 0;
                font-size: 13px;
                color: #6E757E;
            }
        `;
    }

    protected override firstUpdated(): void{
        void this.loadHistory();
    }

    protected override updated(changed: PropertyValues): void{
        super.updated(changed);
        if (this.mode === 'geral') {
            this.renderEvolutionChart(this.filteredDays);
            this.renderMonthlyChart();
            this.renderFocusChart();
            this.renderWeekdayChart();
        } else if (this.mode === 'por-data' && this.selectedGroup && !this.selectedDate) {
            this.renderEvolutionChart(this.selectedGroup.days);
            this.monthlyChart?.destroy();
            this.monthlyChart = null;
            this.focusChart?.destroy();
            this.focusChart = null;
            this.weekdayChart?.destroy();
            this.weekdayChart = null;
        } else {
            this.destroyCharts();
        }
    }

    override disconnectedCallback(): void{
        super.disconnectedCallback();
        this.destroyCharts();
    }

    private destroyCharts(): void{
        this.chart?.destroy();
        this.chart = null;
        this.monthlyChart?.destroy();
        this.monthlyChart = null;
        this.focusChart?.destroy();
        this.focusChart = null;
        this.weekdayChart?.destroy();
        this.weekdayChart = null;
    }

    private renderEvolutionChart(days: WorkoutDay[]): void{
        this.chart?.destroy();
        this.chart = null;
        const {categories, values} = this.buildEvolutionData(days);
        if (values.length === 0 || !this.chartContainer) {
            return;
        }
        const options = {
            chart: {
                type: 'line' as const,
                height: 260,
                background: 'transparent',
                toolbar: {show: false},
                fontFamily: 'inherit',
            },
            theme: {mode: 'dark' as const},
            series: [{name: 'Carga média (kg)', data: values}],
            xaxis: {
                categories,
                labels: {style: {colors: '#8A9099'}},
                axisBorder: {color: '#33383F'},
                axisTicks: {color: '#33383F'},
            },
            yaxis: {
                labels: {style: {colors: '#8A9099'}},
            },
            stroke: {curve: 'smooth' as const, width: 3},
            markers: {size: 4, strokeColors: '#1B1E22'},
            grid: {borderColor: '#33383F'},
            colors: ['#E8354F'],
            tooltip: {theme: 'dark' as const},
            dataLabels: {enabled: false},
        };
        this.chart = new ApexCharts(this.chartContainer, options);
        this.chart.render();
    }

    private renderMonthlyChart(): void{
        const {categories, values} = this.monthlyCounts;
        if (this.filterMonth !== 'all' || values.length <= 1) {
            this.monthlyChart?.destroy();
            this.monthlyChart = null;
            return;
        }
        const options = {
            chart: {
                type: 'bar' as const,
                height: 240,
                background: 'transparent',
                toolbar: {show: false},
                fontFamily: 'inherit',
            },
            theme: {mode: 'dark' as const},
            plotOptions: {bar: {borderRadius: 4, columnWidth: '45%'}},
            series: [{name: 'Treinos', data: values}],
            xaxis: {
                categories,
                labels: {style: {colors: '#8A9099'}},
                axisBorder: {color: '#33383F'},
                axisTicks: {color: '#33383F'},
            },
            yaxis: {
                labels: {style: {colors: '#8A9099'}},
                forceNiceScale: true,
            },
            grid: {borderColor: '#33383F'},
            colors: ['#E8354F'],
            tooltip: {theme: 'dark' as const},
            dataLabels: {enabled: false},
        };
        if (this.monthlyChart) {
            this.monthlyChart.updateOptions(options);
            return;
        }
        if (this.monthlyChartContainer) {
            this.monthlyChart = new ApexCharts(this.monthlyChartContainer, options);
            this.monthlyChart.render();
        }
    }

    private renderFocusChart(): void{
        const {labels, values} = this.focusDistribution;
        if (this.filterFocus !== 'all' || values.length === 0) {
            this.focusChart?.destroy();
            this.focusChart = null;
            return;
        }
        const options = {
            chart: {
                type: 'donut' as const,
                height: 240,
                background: 'transparent',
                fontFamily: 'inherit',
            },
            theme: {mode: 'dark' as const},
            series: values,
            labels,
            legend: {position: 'bottom' as const, labels: {colors: '#ECEAE3'}},
            colors: ['#E8354F', '#E8354F', '#C8102E', '#E8354F', '#65a30d', '#a3e635'],
            stroke: {colors: ['#1B1E22']},
            tooltip: {theme: 'dark' as const},
            dataLabels: {enabled: true, style: {fontSize: '11px'}},
        };
        if (this.focusChart) {
            this.focusChart.updateOptions(options);
            return;
        }
        if (this.focusChartContainer) {
            this.focusChart = new ApexCharts(this.focusChartContainer, options);
            this.focusChart.render();
        }
    }

    private renderWeekdayChart(): void{
        const {categories, values} = this.weekdayDistribution;
        if (values.every(value => value === 0)) {
            this.weekdayChart?.destroy();
            this.weekdayChart = null;
            return;
        }
        const options = {
            chart: {
                type: 'bar' as const,
                height: 240,
                background: 'transparent',
                toolbar: {show: false},
                fontFamily: 'inherit',
            },
            theme: {mode: 'dark' as const},
            plotOptions: {bar: {borderRadius: 4, columnWidth: '45%'}},
            series: [{name: 'Treinos', data: values}],
            xaxis: {
                categories,
                labels: {style: {colors: '#8A9099'}},
                axisBorder: {color: '#33383F'},
                axisTicks: {color: '#33383F'},
            },
            yaxis: {
                labels: {style: {colors: '#8A9099'}},
                forceNiceScale: true,
            },
            grid: {borderColor: '#33383F'},
            colors: ['#E8354F'],
            tooltip: {theme: 'dark' as const},
            dataLabels: {enabled: false},
        };
        if (this.weekdayChart) {
            this.weekdayChart.updateOptions(options);
            return;
        }
        if (this.weekdayChartContainer) {
            this.weekdayChart = new ApexCharts(this.weekdayChartContainer, options);
            this.weekdayChart.render();
        }
    }

    private async loadHistory(): Promise<void>{
        const userId = getSessionUserId();
        if (userId === null) {
            this.groups = [];
            return;
        }
        AcadMain.instance?.showLoading();
        let monthly: MonthlyWorkouts = {};
        try {
            monthly = await fetchTrainingProgress(userId);
        } catch {
            monthly = {};
        } finally {
            AcadMain.instance?.hideLoading();
        }
        this.groups = Object.keys(monthly)
            .filter(key => (monthly[key] ?? []).length > 0)
            .sort((a, b) => b.localeCompare(a))
            .map(key => ({
                key,
                label: this.formatMonthLabel(key),
                days: [...monthly[key]].sort((a, b) => b.date.localeCompare(a.date)),
            }));
    }

    private formatMonthLabel(key: string): string{
        const [year, month] = key.split('-').map(Number);
        return `${MONTH_NAMES[month - 1]} de ${year}`;
    }

    private get selectedGroup(): MonthGroup | null{
        return this.groups.find(group => group.key === this.selectedMonthKey) ?? null;
    }

    private get dateGroups(): DateGroup[]{
        const group = this.selectedGroup;
        if (!group) {
            return [];
        }
        const byDate = new Map<string, WorkoutDay[]>();
        for (const day of group.days) {
            const days = byDate.get(day.date) ?? [];
            days.push(day);
            byDate.set(day.date, days);
        }
        return [...byDate.entries()].map(([date, days]) => ({date, days}));
    }

    private get selectedDateGroup(): DateGroup | null{
        return this.dateGroups.find(dateGroup => dateGroup.date === this.selectedDate) ?? null;
    }

    private get allDays(): WorkoutDay[]{
        return this.groups.flatMap(group => group.days);
    }

    private get availableYears(): string[]{
        const years = new Set(this.groups.map(group => group.key.split('-')[0]));
        return [...years].sort((a, b) => b.localeCompare(a));
    }

    private get availableFocuses(): string[]{
        const focuses = new Set(this.allDays.map(day => day['training-focus']).filter(Boolean));
        return [...focuses].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }

    private get filteredDays(): WorkoutDay[]{
        return this.allDays.filter(day => {
            const [year, month] = day.date.split('-');
            if (this.filterYear !== 'all' && year !== this.filterYear) {
                return false;
            }
            if (this.filterMonth !== 'all' && month !== this.filterMonth) {
                return false;
            }
            if (this.filterFocus !== 'all' && day['training-focus'] !== this.filterFocus) {
                return false;
            }
            return true;
        });
    }

    private lastSeriesWeight(exercise: Exercise): number | null{
        const last = exercise.series[exercise.series.length - 1];
        if (!last) {
            return null;
        }
        const match = last.match(SERIES_WEIGHT_PATTERN);
        return match ? Number(match[1]) : null;
    }

    private parseSeriesEntry(entry: string): {reps: number; carga: number} | null{
        const match = entry.match(SERIES_FULL_PATTERN);
        return match ? {reps: Number(match[1]), carga: Number(match[2])} : null;
    }

    private buildEvolutionData(inputDays: WorkoutDay[]): {categories: string[]; values: number[]}{
        const categories: string[] = [];
        const values: number[] = [];
        const days = [...inputDays].sort((a, b) => a.date.localeCompare(b.date));
        for (const day of days) {
            const weights = Object.values(day.exercises)
                .map(exercise => this.lastSeriesWeight(exercise))
                .filter((weight): weight is number => weight !== null);
            if (weights.length === 0) {
                continue;
            }
            const average = weights.reduce((a, b) => a + b, 0) / weights.length;
            categories.push(formatDateBR(day.date));
            values.push(Math.round(average * 10) / 10);
        }
        return {categories, values};
    }

    private get analysisStats(): AnalysisStats{
        const days = this.filteredDays;
        let totalExercicios = 0;
        let volumeTotal = 0;
        const exerciseCounts = new Map<string, number>();
        const weekdayCounts = new Map<string, number>();
        for (const day of days) {
            weekdayCounts.set(day.day, (weekdayCounts.get(day.day) ?? 0) + 1);
            for (const exercise of Object.values(day.exercises)) {
                totalExercicios += 1;
                exerciseCounts.set(exercise.name, (exerciseCounts.get(exercise.name) ?? 0) + 1);
                for (const entry of exercise.series) {
                    const parsed = this.parseSeriesEntry(entry);
                    if (parsed) {
                        volumeTotal += parsed.reps * parsed.carga;
                    }
                }
            }
        }
        const topExercicio = [...exerciseCounts.entries()].sort((a, b) => b[1] - a[1])[0];
        const topDiaSemana = [...weekdayCounts.entries()].sort((a, b) => b[1] - a[1])[0];
        return {
            totalTreinos: days.length,
            totalExercicios,
            volumeTotal: Math.round(volumeTotal),
            mediaExercicios: days.length > 0 ? Math.round((totalExercicios / days.length) * 10) / 10 : 0,
            topExercicio: topExercicio?.[0] ?? '-',
            topDiaSemana: topDiaSemana ? (WEEKDAY_SHORT[topDiaSemana[0]] ?? topDiaSemana[0]) : '-',
        };
    }

    private get monthlyCounts(): {categories: string[]; values: number[]}{
        const days = this.filterYear === 'all'
            ? this.allDaysMatchingFocus
            : this.allDaysMatchingFocus.filter(day => day.date.startsWith(this.filterYear));
        const counts = new Map<string, number>();
        for (const day of days) {
            const key = day.date.slice(0, 7);
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const sorted = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        return {
            categories: sorted.map(([key]) => {
                const [year, month] = key.split('-').map(Number);
                return `${MONTH_NAMES[month - 1].slice(0, 3)}/${String(year).slice(2)}`;
            }),
            values: sorted.map(([, count]) => count),
        };
    }

    private get allDaysMatchingFocus(): WorkoutDay[]{
        if (this.filterFocus === 'all') {
            return this.allDays;
        }
        return this.allDays.filter(day => day['training-focus'] === this.filterFocus);
    }

    private get focusDistribution(): {labels: string[]; values: number[]}{
        const counts = new Map<string, number>();
        for (const day of this.filteredDays) {
            const focus = day['training-focus'] || 'Sem nome';
            counts.set(focus, (counts.get(focus) ?? 0) + 1);
        }
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
        return {
            labels: sorted.map(([label]) => label),
            values: sorted.map(([, value]) => value),
        };
    }

    private get weekdayDistribution(): {categories: string[]; values: number[]}{
        const counts = new Map<string, number>();
        for (const day of this.filteredDays) {
            counts.set(day.day, (counts.get(day.day) ?? 0) + 1);
        }
        return {
            categories: WEEKDAY_ORDER.map(day => WEEKDAY_SHORT[day]),
            values: WEEKDAY_ORDER.map(day => counts.get(day) ?? 0),
        };
    }

    private openMonth(key: string): void{
        this.selectedMonthKey = key;
        this.selectedDate = null;
    }

    private backToMonths(): void{
        this.selectedMonthKey = null;
        this.selectedDate = null;
    }

    private openDetail(day: WorkoutDay): void{
        this.detailDay = day;
        this.detailModalOpen = true;
    }

    private renderEmptyState(): TemplateResult{
        return html`
            <div class="empty-state">
                <div class="empty-icon"><ui-icon name="chart" size="24"></ui-icon></div>
                <h3>Nenhum treino registrado ainda</h3>
                <p>Assim que você criar treinos em Progressão de Carga, eles aparecem aqui.</p>
            </div>
        `;
    }

    private renderTabs(): TemplateResult{
        return html`
            <div class="tabs">
                <button
                    class="tab ${this.mode === 'geral' ? 'active' : ''}"
                    type="button"
                    @click=${() => (this.mode = 'geral')}
                >Geral</button>
                <button
                    class="tab ${this.mode === 'por-data' ? 'active' : ''}"
                    type="button"
                    @click=${() => (this.mode = 'por-data')}
                >Por Data</button>
            </div>
        `;
    }

    private renderGeral(): TemplateResult{
        const hasChartData = this.buildEvolutionData(this.filteredDays).values.length > 0;
        const hasMonthlyData = this.filterMonth === 'all' && this.monthlyCounts.values.length > 1;
        const hasFocusData = this.filterFocus === 'all' && this.focusDistribution.values.length > 0;
        const hasWeekdayData = this.weekdayDistribution.values.some(value => value > 0);
        const stats = this.analysisStats;
        const days = [...this.filteredDays].sort((a, b) => b.date.localeCompare(a.date));
        return html`
            <div class="filter-row">
                <select .value=${this.filterYear} @change=${(event: Event) => (this.filterYear = (event.target as HTMLSelectElement).value)}>
                    <option value="all">Todos os anos</option>
                    ${this.availableYears.map(year => html`<option value=${year}>${year}</option>`)}
                </select>
                <select .value=${this.filterMonth} @change=${(event: Event) => (this.filterMonth = (event.target as HTMLSelectElement).value)}>
                    <option value="all">Todos os meses</option>
                    ${MONTH_NAMES.map((name, index) => html`
                        <option value=${String(index + 1).padStart(2, '0')}>${name}</option>
                    `)}
                </select>
                <select .value=${this.filterFocus} @change=${(event: Event) => (this.filterFocus = (event.target as HTMLSelectElement).value)}>
                    <option value="all">Todos os treinos</option>
                    ${this.availableFocuses.map(focus => html`<option value=${focus}>${focus}</option>`)}
                </select>
            </div>

            ${stats.totalTreinos === 0 ? html`
                <p class="no-chart-data">Nenhum treino registrado para esse período.</p>
            ` : html`
                <div class="stats-grid">
                    <div class="stat-tile">
                        <ui-icon name="dumbbell" size="16"></ui-icon>
                        <div class="stat-value">${stats.totalTreinos}</div>
                        <div class="stat-label">Treinos</div>
                    </div>
                    <div class="stat-tile">
                        <ui-icon name="layers" size="16"></ui-icon>
                        <div class="stat-value">${stats.totalExercicios}</div>
                        <div class="stat-label">Exercícios</div>
                    </div>
                    <div class="stat-tile">
                        <ui-icon name="chart" size="16"></ui-icon>
                        <div class="stat-value">${stats.volumeTotal.toLocaleString('pt-BR')} kg</div>
                        <div class="stat-label">Volume total</div>
                    </div>
                    <div class="stat-tile">
                        <ui-icon name="repeat" size="16"></ui-icon>
                        <div class="stat-value">${stats.mediaExercicios}</div>
                        <div class="stat-label">Exerc. / treino</div>
                    </div>
                    <div class="stat-tile">
                        <ui-icon name="note" size="16"></ui-icon>
                        <div class="stat-value">${stats.topExercicio}</div>
                        <div class="stat-label">Exercício mais feito</div>
                    </div>
                    <div class="stat-tile">
                        <ui-icon name="calendar" size="16"></ui-icon>
                        <div class="stat-value">${stats.topDiaSemana}</div>
                        <div class="stat-label">Dia mais ativo</div>
                    </div>
                </div>

                ${hasChartData ? html`
                    <div class="chart-card">
                        <h2 class="chart-title">Evolução de Carga</h2>
                        <p class="chart-subtitle">Média da carga do último set de cada exercício, por treino</p>
                        <div id="evolution-chart"></div>
                    </div>
                ` : nothing}

                <div class="chart-grid">
                    ${hasFocusData ? html`
                        <div class="chart-card">
                            <h2 class="chart-title">Distribuição por Treino</h2>
                            <p class="chart-subtitle">Quantas vezes cada treino foi registrado</p>
                            <div id="focus-chart"></div>
                        </div>
                    ` : nothing}
                    ${hasWeekdayData ? html`
                        <div class="chart-card">
                            <h2 class="chart-title">Frequência por Dia da Semana</h2>
                            <p class="chart-subtitle">Em quais dias você mais treina</p>
                            <div id="weekday-chart"></div>
                        </div>
                    ` : nothing}
                </div>

                ${hasMonthlyData ? html`
                    <div class="chart-card">
                        <h2 class="chart-title">Treinos por Mês</h2>
                        <p class="chart-subtitle">Quantidade de treinos registrados em cada mês</p>
                        <div id="monthly-chart"></div>
                    </div>
                ` : nothing}
            `}

            <div class="list">
                ${days.map(day => {
                    const exerciseCount = Object.keys(day.exercises).length;
                    return html`
                        <button class="day-item" type="button" @click=${() => this.openDetail(day)}>
                            <div>
                                <div class="day-item-top">
                                    <span class="day-badge">${day.day}</span>
                                    <span class="day-date"><ui-icon name="calendar" size="12"></ui-icon>${formatDateBR(day.date)}</span>
                                </div>
                                <div class="day-item-label">${day['training-focus']}</div>
                                <div class="day-item-description">
                                    ${exerciseCount} exercício${exerciseCount === 1 ? '' : 's'}
                                </div>
                            </div>
                            <ui-icon class="arrow" name="chevron-right" size="16"></ui-icon>
                        </button>
                    `;
                })}
            </div>
        `;
    }

    private renderPorData(): TemplateResult{
        const group = this.selectedGroup;
        const dateGroup = this.selectedDateGroup;
        if (!group) {
            return this.renderMonths();
        }
        if (!dateGroup) {
            return this.renderDates(group);
        }
        return this.renderTreinos(group, dateGroup);
    }

    private renderMonths(): TemplateResult{
        return html`
            <div class="list">
                ${this.groups.map(group => html`
                    <button class="month-item" type="button" @click=${() => this.openMonth(group.key)}>
                        <div>
                            <div class="month-item-label">${group.label}</div>
                            <div class="month-item-description">
                                ${group.days.length} treino${group.days.length === 1 ? '' : 's'} registrado${group.days.length === 1 ? '' : 's'}
                            </div>
                        </div>
                        <ui-icon name="chevron-right" size="16"></ui-icon>
                    </button>
                `)}
            </div>
        `;
    }

    private renderDates(group: MonthGroup): TemplateResult{
        const hasChartData = this.buildEvolutionData(group.days).values.length > 0;
        return html`
            <div class="days-header">
                <button class="back-link" type="button" @click=${() => this.backToMonths()}>
                    <ui-icon name="chevron-left" size="14"></ui-icon>
                    <span>Meses</span>
                </button>
                <h2>${group.label}</h2>
            </div>
            ${hasChartData ? html`
                <div class="chart-card">
                    <h2 class="chart-title">Evolução de Carga</h2>
                    <p class="chart-subtitle">Média da carga do último set de cada exercício, em ${group.label}</p>
                    <div id="evolution-chart"></div>
                </div>
            ` : nothing}
            <div class="list">
                ${this.dateGroups.map(dateGroup => html`
                    <button class="day-item" type="button" @click=${() => (this.selectedDate = dateGroup.date)}>
                        <div>
                            <div class="day-item-top">
                                <span class="day-badge">${dateGroup.days[0].day}</span>
                                <span class="day-date"><ui-icon name="calendar" size="12"></ui-icon>${formatDateBR(dateGroup.date)}</span>
                            </div>
                            <div class="day-item-description">
                                ${dateGroup.days.length} treino${dateGroup.days.length === 1 ? '' : 's'} registrado${dateGroup.days.length === 1 ? '' : 's'}
                            </div>
                        </div>
                        <ui-icon class="arrow" name="chevron-right" size="16"></ui-icon>
                    </button>
                `)}
            </div>
        `;
    }

    private renderTreinos(group: MonthGroup, dateGroup: DateGroup): TemplateResult{
        return html`
            <div class="days-header">
                <button class="back-link" type="button" @click=${() => (this.selectedDate = null)}>
                    <ui-icon name="chevron-left" size="14"></ui-icon>
                    <span>${group.label}</span>
                </button>
                <h2>${formatDateBR(dateGroup.date)}</h2>
            </div>
            <div class="list">
                ${dateGroup.days.map(day => {
                    const exerciseCount = Object.keys(day.exercises).length;
                    return html`
                        <button class="day-item" type="button" @click=${() => this.openDetail(day)}>
                            <div>
                                <div class="day-item-label">${day['training-focus']}</div>
                                <div class="day-item-description">
                                    ${exerciseCount} exercício${exerciseCount === 1 ? '' : 's'}
                                </div>
                            </div>
                            <ui-icon class="arrow" name="chevron-right" size="16"></ui-icon>
                        </button>
                    `;
                })}
            </div>
        `;
    }

    private get subtitle(): string{
        if (this.groups.length === 0) {
            return 'Nenhum treino registrado ainda';
        }
        if (this.mode === 'geral') {
            return 'Todos os treinos, do mais recente ao mais antigo';
        }
        const group = this.selectedGroup;
        const dateGroup = this.selectedDateGroup;
        if (!group) {
            return 'Selecione um mês para ver os treinos registrados';
        }
        if (!dateGroup) {
            return group.label;
        }
        return `${group.label} · ${formatDateBR(dateGroup.date)}`;
    }

    protected override render(): TemplateResult{
        const hasHistory = this.groups.length > 0;

        return html`
            <header>
                <div class="header-inner">
                    <h1>Histórico de Treinos</h1>
                    <p>${this.subtitle}</p>
                </div>
            </header>

            <main>
                ${hasHistory ? html`
                    ${this.renderTabs()}
                    ${this.mode === 'geral' ? this.renderGeral() : this.renderPorData()}
                ` : this.renderEmptyState()}
            </main>

            <workout-detail-modal
                .open=${this.detailModalOpen}
                .day=${this.detailDay}
                @close=${() => (this.detailModalOpen = false)}
            ></workout-detail-modal>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'workout-history': WorkoutHistory
    }
}
