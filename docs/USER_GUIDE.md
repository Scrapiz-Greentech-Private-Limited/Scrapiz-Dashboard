# Admin Dashboard User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Dashboard Overview](#dashboard-overview)
4. [User Management](#user-management)
5. [Order Management](#order-management)
6. [Inventory Management](#inventory-management)
7. [Service Bookings](#service-bookings)
8. [Push Notifications](#push-notifications)
9. [Referral System](#referral-system)
10. [Audit Logs](#audit-logs)
11. [Search and Filtering](#search-and-filtering)
12. [Bulk Operations](#bulk-operations)

## Getting Started

### Accessing the Dashboard

1. Navigate to the admin dashboard URL (e.g., `https://admin.scrapiz.in`)
2. You will be redirected to the login page if not authenticated
3. Enter your admin credentials (email and password)
4. Click "Login" to access the dashboard

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Screen resolution: 1024x768 or higher (responsive on mobile/tablet)

## Authentication

### Logging In

1. Enter your registered email address
2. Enter your password
3. Click the "Login" button
4. Upon successful authentication, you'll be redirected to the dashboard home

### Session Management

- Your session remains active for a configured duration
- If your session expires, you'll be automatically logged out
- You'll see a "Session Expired" dialog prompting you to log in again

### Logging Out

1. Click on your profile icon in the top-right corner
2. Select "Logout" from the dropdown menu
3. You'll be redirected to the login page

## Dashboard Overview

### Home Page

The dashboard home displays key metrics and analytics:

**Key Performance Indicators (KPIs):**
- Total Revenue
- Total Orders
- Active Users
- Active Agents
- Average Order Value
- Total Customers
- Total Referrals

**Charts and Visualizations:**
- **Revenue Trends**: Monthly revenue for the past 7 months
- **Category Performance**: Orders and revenue by scrap category
- **Agent Performance**: Top agents by completed orders
- **Service Statistics**: Booking distribution by service type
- **Scrap Volume**: Distribution by category

**Recent Activity:**
- Recent orders with status indicators
- Quick access to order details

### Navigation

**Sidebar Menu:**
- Dashboard (Home)
- Users
- Orders
- Inventory (Categories & Products)
- Service Bookings
- Notifications
- Referrals
- Audit Logs
- Settings

**Mobile Navigation:**
- Hamburger menu icon on mobile devices
- Collapsible sidebar for easy access

## User Management

### Viewing Users

1. Click "Users" in the sidebar
2. View the complete list of registered users
3. Table displays: Name, Email, Phone, Role, Status, Registration Date

### Searching Users

1. Use the search bar at the top of the users table
2. Search by: Email, Name, or Phone Number
3. Results update in real-time as you type

### Viewing User Details

1. Click on any user row in the table
2. View detailed information:
   - Personal information (name, email, phone, gender)
   - Account status (active/inactive, staff/superuser)
   - Profile image
   - Referral code and balance
   - Order history
   - Saved addresses
   - Account deletion feedback (if applicable)

### Managing User Addresses

**View Addresses:**
1. Open user details
2. Scroll to the "Addresses" section
3. View all saved addresses with complete details

**Add Address:**
1. Click "Add Address" button
2. Fill in the form:
   - Name and Phone Number
   - Room Number, Street, Area
   - City, State, Country, Pincode
   - Delivery Suggestions
3. Click "Save" to create the address

**Edit Address:**
1. Click the "Edit" icon next to an address
2. Modify the required fields
3. Click "Save" to update

**Delete Address:**
1. Click the "Delete" icon next to an address
2. Confirm the deletion in the dialog
3. Address will be removed immediately

### Updating User Information

1. Open user details
2. Click "Edit Profile" button
3. Modify allowed fields (name, phone, gender, etc.)
4. Click "Save Changes"
5. Changes are reflected immediately

## Order Management

### Viewing Orders

1. Click "Orders" in the sidebar
2. View all scrap collection orders
3. Table displays: Order Number, User, Status, Date, Amount

### Filtering Orders by Status

1. Use the status filter dropdown
2. Select a status:
   - All Orders
   - Pending
   - Confirmed
   - In Progress
   - Completed
   - Cancelled
3. Table updates to show filtered results

### Viewing Order Details

1. Click on any order row
2. View complete order information:
   - Order number and status
   - Customer details
   - Delivery address
   - Order items with quantities and pricing
   - Order images (if uploaded)
   - Estimated order value
   - Redeemed referral bonus
   - Timestamps (created, updated)

### Updating Order Status

1. Open order details
2. Click "Update Status" button
3. Select new status from dropdown
4. Add optional notes
5. Click "Confirm" to update
6. Status changes are reflected immediately

### Cancelling Orders

1. Open order details
2. Click "Cancel Order" button
3. Confirm cancellation in the dialog
4. Provide cancellation reason (optional)
5. Order status changes to "Cancelled"

### Viewing Order Images

1. Open order details
2. Scroll to "Order Images" section
3. Click on any image to view full size
4. Use navigation arrows to browse multiple images

## Inventory Management

### Managing Categories

**View Categories:**
1. Click "Inventory" → "Categories" in the sidebar
2. View all scrap categories
3. Table displays: Name, Product Count, Image

**Create Category:**
1. Click "Add Category" button
2. Enter category name
3. Upload category image (optional)
4. Click "Save"

**Edit Category:**
1. Click "Edit" icon next to a category
2. Modify name or image URL
3. Click "Save Changes"

**View Category Products:**
1. Click on a category row
2. View all products in that category

### Managing Products

**View Products:**
1. Click "Inventory" → "Products" in the sidebar
2. View all products
3. Table displays: Name, Category, Price Range, Unit, Image

**Create Product:**
1. Click "Add Product" button
2. Fill in the form:
   - Product name
   - Category (dropdown)
   - Minimum rate
   - Maximum rate
   - Unit (kg, piece, etc.)
   - Description
   - Image URL (optional)
3. Click "Save"

**Edit Product:**
1. Click "Edit" icon next to a product
2. Modify any fields
3. Click "Save Changes"

**Update Pricing:**
1. Edit product
2. Update min_rate and max_rate fields
3. Save changes
4. New pricing is effective immediately

## Service Bookings

### Viewing Bookings

1. Click "Service Bookings" in the sidebar
2. View all service appointment bookings
3. Table displays: Service Type, Customer, Status, Preferred Date/Time

### Filtering Bookings

1. Use the status filter dropdown
2. Select: All, Pending, Confirmed, Completed, Cancelled
3. Table updates with filtered results

### Viewing Booking Details

1. Click on any booking row
2. View complete information:
   - Service type
   - Customer name and phone
   - Address
   - Preferred date and time
   - Status
   - Google Meet link (if available)
   - Notes
   - Created date

### Updating Booking Status

1. Open booking details
2. Click "Update Status" button
3. Select new status: Pending, Confirmed, Completed, Cancelled
4. Click "Confirm"
5. Status updates immediately

### Accessing Meeting Links

1. Open booking details
2. If a Google Meet link exists, it appears as a clickable button
3. Click to open the meeting in a new tab

## Push Notifications

### Sending Push Notifications

1. Click "Notifications" → "Send Notification" in the sidebar
2. Fill in the notification form:
   - **Title**: Max 50 characters
   - **Message**: Max 200 characters
   - **Category**: Select from dropdown (orders, promotions, updates, etc.)
3. Preview shows character count
4. Click "Send Notification"
5. System filters recipients based on their notification preferences
6. Confirmation message shows number of recipients

### Viewing Notification History

1. Click "Notifications" → "History" in the sidebar
2. View all sent notifications
3. Table displays:
   - Title and message
   - Category
   - Sent date/time
   - Recipient count
   - Delivery status

### Understanding Notification Categories

- **Orders**: Order status updates, delivery notifications
- **Promotions**: Special offers, discounts
- **Updates**: App updates, new features
- **General**: General announcements

**Note**: Users can opt-in/opt-out of categories in their app settings. Only users who have enabled a category will receive notifications in that category.

## Referral System

### Viewing Referrals

1. Click "Referrals" in the sidebar
2. View all users with referral codes
3. Table displays:
   - User name and email
   - Referral code
   - Number of referred users
   - Total earnings
   - Referral balance

### Searching Referrals

1. Use the search bar
2. Search by referral code or user email
3. Results filter in real-time

### Viewing Referral Details

1. Click on any user row
2. View detailed referral information:
   - List of referred users
   - Referral status (completed first order or not)
   - Transaction history
   - Total earnings breakdown

### Viewing Referral Transactions

1. Click "Referrals" → "Transactions" in the sidebar
2. View all referral transactions
3. Table displays:
   - Transaction type (referrer bonus, referee bonus, redemption)
   - Amount
   - Date
   - Order ID (if applicable)
   - Description

### Understanding Referral System

**How it works:**
1. User A shares their referral code with User B
2. User B signs up using User A's code
3. When User B completes their first order:
   - User A receives a referrer bonus
   - User B receives a referee bonus
4. Users can redeem their balance on future orders

**Transaction Types:**
- **Referrer Bonus**: Earned when referred user completes first order
- **Referee Bonus**: Earned by new user on first order
- **Redemption**: Balance used on an order

### Referral Analytics

1. View the referral analytics dashboard
2. Key metrics:
   - Total referrals
   - Active referrals (completed first order)
   - Conversion rate
   - Total bonus paid
   - Average bonus per referral

## Audit Logs

### Viewing Audit Logs

1. Click "Audit Logs" in the sidebar
2. View all system activity logs
3. Table displays:
   - User (name and email)
   - Action type
   - IP address
   - Timestamp

### Filtering Audit Logs

**By Action Type:**
1. Use the action filter dropdown
2. Select: Login, Logout, Password Reset, OAuth Login, Account Deleted
3. View filtered results

**By Date Range:**
1. Click the date range picker
2. Select start and end dates
3. Click "Apply" to filter

**By User:**
1. Use the user search field
2. Enter user email or name
3. View logs for specific user

### Understanding Action Types

- **Login**: User logged in with credentials
- **Logout**: User logged out
- **Password Reset**: User reset their password
- **OAuth Login**: User logged in via Google OAuth
- **Account Deleted**: User deleted their account

### Viewing Detailed Log Information

1. Click on any log entry
2. View complete details:
   - User information
   - Action performed
   - IP address
   - Timestamp
   - Additional metadata (if available)

## Search and Filtering

### Global Search

1. Use the search bar at the top of any list page
2. Search across multiple fields:
   - **Users**: Email, name, phone number
   - **Orders**: Order number, user name, user email
   - **Products**: Product name, category
3. Results update in real-time

### Advanced Filtering

**Combining Filters:**
1. Apply multiple filters simultaneously
2. Filters use AND logic (all conditions must match)
3. Example: Status = "Pending" AND Date Range = "Last 7 days"

**Available Filters:**
- Status filters (orders, bookings)
- Date range filters
- Category filters
- User role filters

### Sorting Tables

1. Click on any column header to sort
2. First click: Ascending order
3. Second click: Descending order
4. Third click: Remove sorting

### Pagination

1. Navigate through pages using pagination controls
2. Default page size: 50 items
3. Filters and search persist across pages
4. Jump to specific page using page number input

## Bulk Operations

### Selecting Multiple Items

1. Use checkboxes in the leftmost column
2. Click individual checkboxes to select specific items
3. Click header checkbox to select all items on current page

### Bulk Status Update (Orders)

1. Select multiple orders using checkboxes
2. Click "Bulk Update Status" button
3. Select new status from dropdown
4. Click "Confirm"
5. Progress indicator shows update progress
6. Summary displays successful and failed updates

### Exporting Data

**Export Orders:**
1. Navigate to Orders page
2. Apply filters if needed (optional)
3. Click "Export to CSV" button
4. CSV file downloads with selected/filtered orders
5. Includes: Order number, user, status, date, amount, items

**Export Users:**
1. Navigate to Users page
2. Apply filters if needed (optional)
3. Click "Export to CSV" button
4. CSV file downloads with user data
5. Includes: Name, email, phone, role, status, registration date

### Monitoring Bulk Operations

1. Progress bar shows operation progress
2. Toast notifications indicate completion
3. Summary dialog shows:
   - Total items processed
   - Successful operations
   - Failed operations (with reasons)

## Tips and Best Practices

### Performance Tips

1. Use filters to narrow down large datasets
2. Export data in smaller batches for better performance
3. Clear browser cache if experiencing slow loading

### Data Management

1. Regularly review and update product pricing
2. Monitor order statuses and update promptly
3. Review audit logs for security monitoring
4. Keep user information up to date

### Notification Best Practices

1. Keep titles concise and clear (under 50 characters)
2. Write actionable messages (under 200 characters)
3. Use appropriate categories for better targeting
4. Avoid sending too many notifications (notification fatigue)

### Security Best Practices

1. Log out when finished, especially on shared computers
2. Never share your admin credentials
3. Review audit logs regularly for suspicious activity
4. Report any security concerns immediately

## Troubleshooting

### Common Issues

**Cannot Log In:**
- Verify email and password are correct
- Check if account has staff/superuser privileges
- Clear browser cache and cookies
- Try a different browser

**Session Expired:**
- Log in again with your credentials
- Session timeout is configured by system administrator

**Data Not Loading:**
- Check internet connection
- Refresh the page
- Clear browser cache
- Check if backend API is accessible

**Changes Not Saving:**
- Verify all required fields are filled
- Check for validation errors (red text)
- Ensure you have proper permissions
- Try again after a few moments

**Images Not Displaying:**
- Check if image URL is valid
- Verify S3 bucket permissions
- Try refreshing the page

### Getting Help

If you encounter issues not covered in this guide:

1. Check the troubleshooting guide (docs/TROUBLESHOOTING.md)
2. Contact your system administrator
3. Report bugs to the development team
4. Check the developer documentation for technical details

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Focus search bar
- `Esc`: Close dialogs/modals
- `Tab`: Navigate between form fields
- `Enter`: Submit forms
- `Arrow Keys`: Navigate tables (when focused)

## Accessibility Features

- Full keyboard navigation support
- Screen reader compatible
- High contrast mode available
- Adjustable text sizes
- ARIA labels on all interactive elements

---

**Version**: 1.0  
**Last Updated**: 2024  
**For Support**: Contact your system administrator
