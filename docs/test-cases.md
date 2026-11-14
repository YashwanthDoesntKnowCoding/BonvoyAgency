# Test Case Table

| ID | Scenario | Expected result | Status |
| --- | --- | --- | --- |
| TC-01 | Login with valid credentials | 200 and JWT returned | Pass |
| TC-02 | Login with wrong password | 401 unauthorized | Pass |
| TC-03 | List packages | returns filtered packages | Pass |
| TC-04 | Booking quote | correct subtotal and tax | Pass |
| TC-05 | Double-booking concurrency | only one seat booking succeeds | Expected |
| TC-06 | Cancel booking before 3 days | refund percentage 0 | Expected |
| TC-07 | Cancel booking after 7 days | refund percentage 75 | Expected |
