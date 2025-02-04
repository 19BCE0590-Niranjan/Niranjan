import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { CustomerModal } from './components/CustomerModal';
import { CustomerCard } from './components/CustomerCard';
import { OrderModal } from './components/OrderModal';
import { ThemeToggle } from './components/ThemeToggle';
import { supabase } from './lib/supabase';
import { Customer } from './types/customer';
import { Order, OrderItem } from './types/order';

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | undefined
  >();
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<
    Customer | undefined
  >();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    fetchCustomers();
    fetchOrders();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to fetch customers');
      return;
    }

    setCustomers(data);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          id,
          item_type,
          quantity,
          status,
          price
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch orders');
      return;
    }

    // Transform the data to match the Order type
    const ordersWithItems = data?.map(order => ({
      ...order,
      items: order.items || [] // Ensure items is always an array
    }));

    setOrders(ordersWithItems || []);
  };

  const findDuplicateCustomer = (customerData: Partial<Customer>) => {
    return customers.find(
      (existing) =>
        existing.name.toLowerCase() === customerData.name?.toLowerCase() &&
        existing.phone === customerData.phone &&
        existing.shirt_measurements === customerData.shirt_measurements &&
        existing.pants_measurements === customerData.pants_measurements &&
        existing.other_measurements === customerData.other_measurements &&
        (!selectedCustomer || existing.id !== selectedCustomer.id)
    );
  };

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    try {
      const duplicate = findDuplicateCustomer(customerData);

      if (duplicate) {
        toast.error('This customer already exists');
        setIsModalOpen(false);
        setSelectedCustomer(undefined);

        // Highlight the duplicate customer card
        const element = document.getElementById(`customer-${duplicate.id}`);
        if (element) {
          element.classList.add(
            'ring-4',
            'ring-yellow-400',
            'dark:ring-yellow-500'
          );
          setTimeout(() => {
            element.classList.remove(
              'ring-4',
              'ring-yellow-400',
              'dark:ring-yellow-500'
            );
          }, 2000);
        }

        return;
      }

      if (selectedCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', selectedCustomer.id);

        if (error) throw error;
        toast.success('Customer updated successfully');
      } else {
        const { error } = await supabase.from('customers').insert(customerData);

        if (error) throw error;
        toast.success('Customer added successfully');
      }

      await fetchCustomers();
      setIsModalOpen(false);
      setSelectedCustomer(undefined);
    } catch (error: unknown) {
      toast.error(`Failed to save customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveOrder = async (
    orderData: Partial<Order>,
    items: Partial<OrderItem>[]
  ) => {
    try {
      if (selectedOrder) {
        // Update existing order
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            due_date: orderData.due_date,
            payment_status: orderData.payment_status,
            total_amount: orderData.total_amount,
            amount_paid: orderData.amount_paid,
            notes: orderData.notes
          })
          .eq('id', selectedOrder.id);

        if (orderError) throw orderError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', selectedOrder.id);

        if (deleteError) throw deleteError;

        // Insert updated items
        const itemsToInsert = items
          .filter((item) => item.quantity && item.quantity > 0)
          .map((item) => ({
            order_id: selectedOrder.id,
            item_type: item.item_type,
            quantity: item.quantity,
            status: item.status || 'not_started',
            price: item.price
          }));

        if (itemsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);

          if (insertError) throw insertError;
        }

        toast.success('Order updated successfully');
      } else {
        // Create new order
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: selectedCustomer?.id,
            due_date: orderData.due_date,
            payment_status: orderData.payment_status,
            total_amount: orderData.total_amount,
            amount_paid: orderData.amount_paid,
            notes: orderData.notes
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Insert order items
        const itemsToInsert = items
          .filter((item) => item.quantity && item.quantity > 0)
          .map((item) => ({
            order_id: newOrder.id,
            item_type: item.item_type,
            quantity: item.quantity,
            status: item.status || 'not_started',
            price: item.price
          }));

        if (itemsToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        toast.success('Order created successfully');
      }

      await fetchOrders();
      setIsOrderModalOpen(false);
      setSelectedOrder(undefined);
    } catch (error) {
      console.error('Failed to save order:', error);
      toast.error('Failed to save order');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id);

      if (error) throw error;

      toast.success('Customer deleted successfully');
      await fetchCustomers();
      setIsDeleteModalOpen(false);
      setCustomerToDelete(undefined);
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  const getCustomerOrders = (customerId: string) => {
    return orders.filter((order) => order.customer_id === customerId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
            Nizy Fashions
          </h1>
          <ThemeToggle
            isDark={isDarkMode}
            onToggle={() => setIsDarkMode(!isDarkMode)}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="relative flex-1 w-full max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers by name or phone..."
              className="block w-full pl-10 pr-3 py-3 border-0 rounded-xl text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            />
          </div>
          <button
            onClick={() => {
              setSelectedCustomer(undefined);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Customer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} id={`customer-${customer.id}`}>
              <CustomerCard
                customer={customer}
                orders={getCustomerOrders(customer.id)}
                onEdit={(customer) => {
                  setSelectedCustomer(customer);
                  setIsModalOpen(true);
                }}
                onDelete={(customer) => {
                  setCustomerToDelete(customer);
                  setIsDeleteModalOpen(true);
                }}
                onAddOrder={(customer) => {
                  setSelectedCustomer(customer);
                  setSelectedOrder(undefined);
                  setIsOrderModalOpen(true);
                }}
                onEditOrder={(order) => {
                  setSelectedOrder(order);
                  setSelectedCustomer(
                    customers.find((c) => c.id === order.customer_id)
                  );
                  setIsOrderModalOpen(true);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(undefined);
        }}
        onSave={handleSaveCustomer}
        customer={selectedCustomer}
        isDark={isDarkMode}
      />

      {selectedCustomer && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setSelectedOrder(undefined);
          }}
          onSave={handleSaveOrder}
          customer={selectedCustomer}
          order={selectedOrder}
          isDark={isDarkMode}
        />
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Delete Customer
            </h3>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
              Are you sure you want to delete {customerToDelete?.name}? This
              action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#1f2937',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          },
        }}
      />
    </div>
  );
}

export default App;