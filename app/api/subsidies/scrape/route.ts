import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

interface SubsidyData {
    locationName1: string;
    locationName2: string;
    totalCount: number;
    recievedCount: number;
    releaseCount: number;
    remainCount: number;
    etc: string;
}

function firstNumber(text: string): number | null {
    const match = text.match(/\d[\d,]*/);
    if (!match) return null;
    return parseInt(match[0].replace(/,/g, ''), 10);
}

function parseSubsidy(html: string): SubsidyData[] {
    const $ = cheerio.load(html);
    const subsidies: SubsidyData[] = [];

    $('tbody tr').each((_, tr) => {
        const tds = $(tr).find('td');
        if (tds.length < 9) return; // 최소 9개 필요 (index 0-8)

        const locationName1 = $(tds[0]).text().trim();
        const locationName2 = $(tds[1]).text().trim();
        // tds[2]: 차종, tds[3]: 대상자선정방법, tds[4]: 접수기간
        const totalText = $(tds[5]).text().trim();      // 보급대수
        const recievedText = $(tds[6]).text().trim();   // 접수대수
        const releaseText = $(tds[7]).text().trim();    // 출고대수
        const remainText = $(tds[8]).text().trim();     // 잔여대수
        const etcText = tds.length >= 10 ? $(tds[9]).text().trim() : ''; // 비고

        subsidies.push({
            locationName1,
            locationName2,
            totalCount: firstNumber(totalText) || 0,
            recievedCount: firstNumber(recievedText) || 0,
            releaseCount: firstNumber(releaseText) || 0,
            remainCount: firstNumber(remainText) || 0,
            etc: etcText,
        });
    });

    return subsidies;
}

async function launchBrowser() {
    const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

    if (isVercel) {
        // Vercel/서버리스 환경: @sparticuz/chromium 사용
        return puppeteer.launch({
            args: chromium.args,
            defaultViewport: { width: 1280, height: 720 },
            executablePath: await chromium.executablePath(),
            headless: true,
        });
    }

    // 로컬 환경: 시스템 Chrome 사용
    const localChromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',  // macOS
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',    // Windows
        '/usr/bin/google-chrome',                                        // Linux
        '/usr/bin/chromium-browser',                                     // Linux (Chromium)
    ];

    let executablePath: string | undefined;
    for (const p of localChromePaths) {
        try {
            const fs = await import('fs');
            if (fs.existsSync(p)) {
                executablePath = p;
                break;
            }
        } catch { /* ignore */ }
    }

    return puppeteer.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
}

// POST - scrape subsidies from ev.or.kr
export async function POST() {
    let browser;
    try {
        browser = await launchBrowser();

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        const url = 'https://ev.or.kr/nportal/buySupprt/initSubsidyPaymentCheckAction.do';

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('.contentList', { visible: true, timeout: 30000 });

        const tableHtml = await page.$eval('.contentList', (el) => el.innerHTML);
        const subsidies = parseSubsidy(tableHtml);

        await browser.close();
        browser = null;

        if (subsidies.length === 0) {
            return NextResponse.json({
                error: '보조금 데이터를 파싱할 수 없습니다.',
            }, { status: 500 });
        }

        // Upsert each subsidy
        let updatedCount = 0;
        for (const subsidy of subsidies) {
            await prisma.subsidy.upsert({
                where: {
                    locationName1_locationName2: {
                        locationName1: subsidy.locationName1,
                        locationName2: subsidy.locationName2,
                    },
                },
                update: {
                    totalCount: subsidy.totalCount,
                    recievedCount: subsidy.recievedCount,
                    releaseCount: subsidy.releaseCount,
                    remainCount: subsidy.remainCount,
                    etc: subsidy.etc || null,
                },
                create: {
                    locationName1: subsidy.locationName1,
                    locationName2: subsidy.locationName2,
                    totalCount: subsidy.totalCount,
                    recievedCount: subsidy.recievedCount,
                    releaseCount: subsidy.releaseCount,
                    remainCount: subsidy.remainCount,
                    etc: subsidy.etc || null,
                },
            });
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `${updatedCount}개 보조금 데이터가 업데이트되었습니다.`,
            count: updatedCount,
        });
    } catch (error) {
        if (browser) await browser.close();
        console.error('Failed to scrape subsidies:', error);
        return NextResponse.json({
            error: `보조금 데이터 스크래핑 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }, { status: 500 });
    }
}
