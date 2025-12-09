


/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const discount = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discount;
    // @TODO: Расчет выручки от операции ++
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    if (index === 0) {
        return 0.15 * seller.profit;
    } else if (index === 1 || index === 2) {
        return 0.1 * seller.profit;
    } else if (index === total - 1) {
        return 0;
    } else {
        return 0.05 * seller.profit;
    }

}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    if (!data
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
        || !Array.isArray(data.purchase_records)
    ) {
        throw new Error('Некорректные входные данные');
    }

    if (!options ||
        typeof options.calculateRevenue !== "function" ||
        typeof options.calculateBonus !== "function"
    ) {
        throw new Error('Чего-то не хватает');
    }
    const { calculateRevenue, calculateBonus } = options;

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        first_name: seller.first_name,
        last_name: seller.last_name,
        start_date: seller.start_date,
        position: seller.position,
        sales_count: 0,
        revenue: 0,
        profit: 0,
        products_sold: {}
    }));

    const sellerIndex = Object.fromEntries(
        sellerStats.map(seller => [seller.id, seller])
    );

    const productIndex = Object.fromEntries(
        data.products.map(product => [product.sku, product])
    );

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count++;


        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateSimpleRevenue(item, product);
            const itemProfit = revenue - cost;

            seller.revenue += revenue;
            seller.profit += itemProfit;

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;  // По артикулу товара увеличить его проданное количество у продавца
        });

    });
    sellerStats.sort((sellerA, sellerB) =>
        sellerB.profit - sellerA.profit
    );


    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller); 

        const productsArray = Object.entries(seller.products_sold);
        productsArray.sort((productA, productB) =>
            productB[1] - productA[1]
        );
        seller.top_products = productsArray.slice(0, 10).map(entry => ({
            sku: entry[0],
            quantity: entry[1]
        }));
    });

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        sales_count: seller.sales_count,
        revenue: +(seller.revenue).toFixed(2),
        profit: +(seller.profit).toFixed(2),
        bonus: +(seller.bonus).toFixed(2),
        top_products: seller.top_products
    }));


}
